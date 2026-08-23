import {
  PrismaClient,
  BetStatus,
  FriendshipStatus,
  MatchStatus,
} from "@prisma/client";
import { GraphQLError } from "graphql";
import {
  POINTS_STAKE,
  TEAM_PICK_EXCLUSIVE_WINDOW_HOURS,
  TEAM_PICK_DEADLINE_HOURS,
} from "../../constants/bet";

export class ChallengeService {
  constructor(private prisma: PrismaClient) {}

  /** Creates a new bet challenge between two Betmates for an upcoming match. */
  async sendChallenge(
    challengerId: string,
    matchId: string,
    challengeeId: string,
  ) {
    if (challengerId === challengeeId) {
      throw new GraphQLError("You cannot challenge yourself", {
        extensions: { code: "INVALID_INPUT" },
      });
    }

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new GraphQLError("Match not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (match.status !== MatchStatus.UPCOMING) {
      throw new GraphQLError("Can only challenge on upcoming matches", {
        extensions: { code: "MATCH_NOT_UPCOMING" },
      });
    }

    const twoHoursFromNow = new Date(
      Date.now() + TEAM_PICK_EXCLUSIVE_WINDOW_HOURS * 60 * 60 * 1000,
    );
    if (match.scheduledAt <= twoHoursFromNow) {
      throw new GraphQLError("Match starts too soon to send a challenge", {
        extensions: { code: "MATCH_TOO_SOON" },
      });
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: challengerId, receiverId: challengeeId },
          { requesterId: challengeeId, receiverId: challengerId },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
    });

    if (!friendship) {
      throw new GraphQLError("You can only challenge your Betmates", {
        extensions: { code: "NOT_BETMATES" },
      });
    }

    // One active bet per pair per match (ignore terminal statuses)
    const existing = await this.prisma.bet.findFirst({
      where: {
        matchId,
        status: {
          notIn: [BetStatus.DECLINED, BetStatus.EXPIRED, BetStatus.CANCELLED],
        },
        OR: [
          { challengerId, challengeeId },
          { challengerId: challengeeId, challengeeId: challengerId },
        ],
      },
    });

    if (existing) {
      throw new GraphQLError(
        "A bet already exists for this match with this Betmate",
        {
          extensions: { code: "BET_EXISTS" },
        },
      );
    }

    return this.prisma.bet.create({
      data: {
        matchId,
        challengerId,
        challengeeId,
        status: BetStatus.PENDING,
        pointsStake: POINTS_STAKE,
      },
      include: {
        match: true,
        challenger: true,
        challengee: true,
        tossWinner: true,
        winner: true,
      },
    });
  }

  /** Accepts a pending challenge. Auto-expires if match starts within 2 hours. */
  async acceptChallenge(betId: string, currentUserId: string) {
    const bet = await this.findBetOrThrow(betId);

    if (bet.challengeeId !== currentUserId) {
      throw new GraphQLError("Only the challenged player can accept", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    if (bet.status !== BetStatus.PENDING) {
      throw new GraphQLError("This challenge is no longer pending", {
        extensions: { code: "INVALID_STATUS" },
      });
    }

    const twoHoursFromNow = new Date(
      Date.now() + TEAM_PICK_EXCLUSIVE_WINDOW_HOURS * 60 * 60 * 1000,
    );
    if (bet.match.scheduledAt <= twoHoursFromNow) {
      await this.prisma.bet.update({
        where: { id: betId },
        data: { status: BetStatus.EXPIRED },
      });
      throw new GraphQLError("Challenge expired — match starts too soon", {
        extensions: { code: "CHALLENGE_EXPIRED" },
      });
    }

    return this.prisma.bet.update({
      where: { id: betId },
      data: { status: BetStatus.ACCEPTED },
      include: {
        match: true,
        challenger: true,
        challengee: true,
        tossWinner: true,
        winner: true,
      },
    });
  }

  /** Declines a pending challenge. */
  async declineChallenge(betId: string, currentUserId: string) {
    const bet = await this.findBetOrThrow(betId);

    if (bet.challengeeId !== currentUserId) {
      throw new GraphQLError("Only the challenged player can decline", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    if (bet.status !== BetStatus.PENDING) {
      throw new GraphQLError("This challenge is no longer pending", {
        extensions: { code: "INVALID_STATUS" },
      });
    }

    await this.prisma.bet.update({
      where: { id: betId },
      data: { status: BetStatus.DECLINED },
    });
    return true;
  }

  /** Cancels a pending challenge. Only the challenger can cancel. */
  async cancelChallenge(betId: string, currentUserId: string) {
    const bet = await this.findBetOrThrow(betId);

    if (bet.challengerId !== currentUserId) {
      throw new GraphQLError("Only the challenger can cancel a challenge", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    if (bet.status !== BetStatus.PENDING) {
      throw new GraphQLError("Only pending challenges can be cancelled", {
        extensions: { code: "INVALID_STATUS" },
      });
    }

    await this.prisma.bet.update({
      where: { id: betId },
      data: { status: BetStatus.CANCELLED },
    });
    return true;
  }

  /** Randomly determines which player picks their team first. */
  async flipCoin(betId: string, currentUserId: string) {
    const bet = await this.findBetOrThrow(betId);

    if (
      bet.challengerId !== currentUserId &&
      bet.challengeeId !== currentUserId
    ) {
      throw new GraphQLError("You are not part of this bet", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    if (bet.status !== BetStatus.ACCEPTED) {
      throw new GraphQLError(
        "Coin can only be flipped after challenge is accepted",
        {
          extensions: { code: "INVALID_STATUS" },
        },
      );
    }

    const tossWinnerId =
      Math.random() < 0.5 ? bet.challengerId : bet.challengeeId;

    return this.prisma.bet.update({
      where: { id: betId },
      data: {
        tossWinnerId,
        tossDoneAt: new Date(),
        status: BetStatus.TOSS_DONE,
      },
      include: {
        match: true,
        challenger: true,
        challengee: true,
        tossWinner: true,
        winner: true,
      },
    });
  }

  /** Locks in team picks for both players. The picker's opponent gets the other team automatically. */
  async selectTeam(betId: string, currentUserId: string, team: string) {
    const bet = await this.findBetOrThrow(betId);

    if (
      bet.challengerId !== currentUserId &&
      bet.challengeeId !== currentUserId
    ) {
      throw new GraphQLError("You are not part of this bet", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    if (bet.status !== BetStatus.TOSS_DONE) {
      throw new GraphQLError("Teams can only be selected after the coin toss", {
        extensions: { code: "INVALID_STATUS" },
      });
    }

    const validTeams = [bet.match.team1, bet.match.team2];
    if (!validTeams.includes(team)) {
      throw new GraphQLError(`Team must be one of: ${validTeams.join(", ")}`, {
        extensions: { code: "INVALID_TEAM" },
      });
    }

    const now = new Date();
    const matchTime = bet.match.scheduledAt;
    const oneHourBefore = new Date(
      matchTime.getTime() - TEAM_PICK_DEADLINE_HOURS * 60 * 60 * 1000,
    );
    const twoHoursBefore = new Date(
      matchTime.getTime() - TEAM_PICK_EXCLUSIVE_WINDOW_HOURS * 60 * 60 * 1000,
    );

    if (now >= oneHourBefore) {
      await this.prisma.bet.update({
        where: { id: betId },
        data: { status: BetStatus.EXPIRED },
      });
      throw new GraphQLError("Team selection window has closed", {
        extensions: { code: "SELECTION_WINDOW_CLOSED" },
      });
    }

    if (now < twoHoursBefore && bet.tossWinnerId !== currentUserId) {
      throw new GraphQLError("Only the toss winner can pick a team right now", {
        extensions: { code: "NOT_TOSS_WINNER" },
      });
    }

    // Both can pick from T-2h to T-1h — first write wins (DB unique constraint handles race)
    const otherTeam =
      team === bet.match.team1 ? bet.match.team2 : bet.match.team1;
    const isChallenger = bet.challengerId === currentUserId;

    return this.prisma.bet.update({
      where: { id: betId },
      data: {
        challengerPick: isChallenger ? team : otherTeam,
        challengeePick: isChallenger ? otherTeam : team,
        status: BetStatus.TEAMS_LOCKED,
      },
      include: {
        match: true,
        challenger: true,
        challengee: true,
        tossWinner: true,
        winner: true,
      },
    });
  }

  /** Returns all bets the current user is a party to, optionally filtered by status. */
  async getMyBets(currentUserId: string, status?: BetStatus) {
    return this.prisma.bet.findMany({
      where: {
        OR: [{ challengerId: currentUserId }, { challengeeId: currentUserId }],
        ...(status ? { status } : {}),
      },
      include: {
        match: true,
        challenger: true,
        challengee: true,
        tossWinner: true,
        winner: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private async findBetOrThrow(betId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        match: true,
        challenger: true,
        challengee: true,
        tossWinner: true,
        winner: true,
      },
    });

    if (!bet) {
      throw new GraphQLError("Bet not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return bet;
  }
}
