import { PrismaClient, BetStatus, FriendshipStatus } from "@prisma/client";
import { GraphQLError } from "graphql";
import { POINTS_STAKE } from "../../constants/bet";

export class StatsService {
  constructor(private prisma: PrismaClient) {}

  /** Returns completed bet record and net points between two Betmates. */
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

  /** Returns the current user and all their Betmates ranked by total points. */
  async getLeaderboard(currentUserId: string) {
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
    if (!currentUser) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const allUsers = [currentUser, ...betmates];

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
}
