import {
  PrismaClient,
  BetStatus,
  FriendshipStatus,
  MatchStatus,
} from "@prisma/client";
import { GraphQLError } from "graphql";

const POINTS_STAKE = 10;
const TEAM_PICK_EXCLUSIVE_WINDOW_HOURS = 2; // toss winner exclusive until T-2h
const TEAM_PICK_DEADLINE_HOURS = 1; // both lose access at T-1h → auto-expire

export class BetService {
  constructor(private prisma: PrismaClient) {}

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

    // Verify match exists and is upcoming
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

    // Reject challenges sent too close to match start (< 2h)
    const twoHoursFromNow = new Date(
      Date.now() + TEAM_PICK_EXCLUSIVE_WINDOW_HOURS * 60 * 60 * 1000,
    );
    if (match.scheduledAt <= twoHoursFromNow) {
      throw new GraphQLError("Match starts too soon to send a challenge", {
        extensions: { code: "MATCH_TOO_SOON" },
      });
    }

    // Verify they are accepted Betmates
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

    // One bet per pair per match
    const existing = await this.prisma.bet.findFirst({
      where: {
        matchId,
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

    // Check match hasn't become too close
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

    // Random 50/50 toss between challenger and challengee
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

    // Validate team is one of the two match teams
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

    // After T-1h: nobody can pick
    if (now >= oneHourBefore) {
      await this.prisma.bet.update({
        where: { id: betId },
        data: { status: BetStatus.EXPIRED },
      });
      throw new GraphQLError("Team selection window has closed", {
        extensions: { code: "SELECTION_WINDOW_CLOSED" },
      });
    }

    // Before T-2h: only toss winner can pick
    if (now < twoHoursBefore && bet.tossWinnerId !== currentUserId) {
      throw new GraphQLError("Only the toss winner can pick a team right now", {
        extensions: { code: "NOT_TOSS_WINNER" },
      });
    }

    // Both can pick from T-2h to T-1h — first write wins (DB unique constraint handles race)
    const otherTeam =
      team === bet.match.team1 ? bet.match.team2 : bet.match.team1;

    const isChallenger = bet.challengerId === currentUserId;
    const challengerPick = isChallenger ? team : otherTeam;
    const challengeePick = isChallenger ? otherTeam : team;

    return this.prisma.bet.update({
      where: { id: betId },
      data: {
        challengerPick,
        challengeePick,
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

  async getHeadToHead(currentUserId: string, betmateId: string) {
    const bets = await this.prisma.bet.findMany({
      where: {
        OR: [
          { challengerId: currentUserId, challengeeId: betmateId },
          { challengerId: betmateId, challengeeId: currentUserId },
        ],
        status: BetStatus.COMPLETED,
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

    const myWins = bets.filter((b) => b.winnerId === currentUserId).length;
    const theirWins = bets.filter((b) => b.winnerId === betmateId).length;
    const netPoints = (myWins - theirWins) * POINTS_STAKE;

    const betmate = await this.prisma.user.findUnique({
      where: { id: betmateId },
    });
    if (!betmate) {
      throw new GraphQLError("Betmate not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return { betmate, myWins, theirWins, netPoints, bets };
  }

  async getLeaderboard(currentUserId: string) {
    // Get all accepted betmates
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: currentUserId, status: FriendshipStatus.ACCEPTED },
          { receiverId: currentUserId, status: FriendshipStatus.ACCEPTED },
        ],
      },
      include: { requester: true, receiver: true },
    });

    const betmates = friendships.map((f) =>
      f.requesterId === currentUserId ? f.receiver : f.requester,
    );

    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser)
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });

    const allUsers = [currentUser, ...betmates];

    // Get completed bet counts per user
    const completedBets = await this.prisma.bet.findMany({
      where: {
        OR: [{ challengerId: currentUserId }, { challengeeId: currentUserId }],
        status: BetStatus.COMPLETED,
      },
      select: { challengerId: true, challengeeId: true, winnerId: true },
    });

    const statsMap = new Map<
      string,
      { betsWon: number; betsLost: number; totalBets: number }
    >();

    for (const user of allUsers) {
      const userBets = completedBets.filter(
        (b) => b.challengerId === user.id || b.challengeeId === user.id,
      );
      statsMap.set(user.id, {
        betsWon: userBets.filter((b) => b.winnerId === user.id).length,
        betsLost: userBets.filter((b) => b.winnerId !== user.id).length,
        totalBets: userBets.length,
      });
    }

    return allUsers
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        rank: index + 1,
        user,
        points: user.points,
        ...(statsMap.get(user.id) ?? { betsWon: 0, betsLost: 0, totalBets: 0 }),
      }));
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
