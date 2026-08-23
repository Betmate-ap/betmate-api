import { PrismaClient, FriendshipStatus } from "@prisma/client";
import { GraphQLError } from "graphql";

export class FriendService {
  constructor(private prisma: PrismaClient) {}

  /** Searches users by name or username, excluding blocked and inactive accounts. Returns up to 20 results. */
  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length < 2) {
      throw new GraphQLError("Search query must be at least 2 characters", {
        extensions: { code: "INVALID_INPUT" },
      });
    }

    const term = query.trim();

    const blocks = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: currentUserId, status: FriendshipStatus.BLOCKED },
          { receiverId: currentUserId, status: FriendshipStatus.BLOCKED },
        ],
      },
      select: { requesterId: true, receiverId: true },
    });

    const blockedUserIds = blocks.map((b) =>
      b.requesterId === currentUserId ? b.receiverId : b.requesterId,
    );

    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          { id: { notIn: blockedUserIds } },
          { isActive: true },
          {
            OR: [
              { username: { contains: term, mode: "insensitive" } },
              { firstName: { contains: term, mode: "insensitive" } },
              { lastName: { contains: term, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: 20,
    });

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          {
            requesterId: currentUserId,
            receiverId: { in: users.map((u) => u.id) },
          },
          {
            receiverId: currentUserId,
            requesterId: { in: users.map((u) => u.id) },
          },
        ],
      },
    });

    return users.map((user) => {
      const friendship = friendships.find(
        (f) =>
          (f.requesterId === currentUserId && f.receiverId === user.id) ||
          (f.receiverId === currentUserId && f.requesterId === user.id),
      );
      return {
        user,
        friendshipStatus: friendship?.status ?? null,
        friendshipId: friendship?.id ?? null,
      };
    });
  }

  /** Sends a Betmate request to another user. */
  async sendFriendRequest(requesterId: string, receiverId: string) {
    if (requesterId === receiverId) {
      throw new GraphQLError("You cannot add yourself as a Betmate", {
        extensions: { code: "INVALID_INPUT" },
      });
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver || !receiver.isActive) {
      throw new GraphQLError("User not found", {
        extensions: { code: "USER_NOT_FOUND" },
      });
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new GraphQLError("Already Betmates", {
          extensions: { code: "ALREADY_BETMATES" },
        });
      }
      if (existing.status === FriendshipStatus.PENDING) {
        throw new GraphQLError("Friend request already pending", {
          extensions: { code: "REQUEST_PENDING" },
        });
      }
      if (existing.status === FriendshipStatus.BLOCKED) {
        throw new GraphQLError("Unable to send friend request", {
          extensions: { code: "BLOCKED" },
        });
      }
    }

    return this.prisma.friendship.create({
      data: { requesterId, receiverId, status: FriendshipStatus.PENDING },
      include: { requester: true, receiver: true },
    });
  }

  /** Accepts a pending Betmate request. Only the recipient can accept. */
  async acceptFriendRequest(friendshipId: string, currentUserId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: { requester: true, receiver: true },
    });

    if (!friendship) {
      throw new GraphQLError("Friend request not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (friendship.receiverId !== currentUserId) {
      throw new GraphQLError("Only the recipient can accept a friend request", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new GraphQLError("Friend request is no longer pending", {
        extensions: { code: "INVALID_STATUS" },
      });
    }

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
      include: { requester: true, receiver: true },
    });
  }

  /** Declines and removes a pending Betmate request. Only the recipient can decline. */
  async declineFriendRequest(friendshipId: string, currentUserId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new GraphQLError("Friend request not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (friendship.receiverId !== currentUserId) {
      throw new GraphQLError(
        "Only the recipient can decline a friend request",
        {
          extensions: { code: "FORBIDDEN" },
        },
      );
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new GraphQLError("Friend request is no longer pending", {
        extensions: { code: "INVALID_STATUS" },
      });
    }

    await this.prisma.friendship.delete({ where: { id: friendshipId } });
    return true;
  }

  /** Removes an existing Betmate relationship. */
  async removeBetmate(currentUserId: string, otherUserId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, receiverId: otherUserId },
          { requesterId: otherUserId, receiverId: currentUserId },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
    });

    if (!friendship) {
      throw new GraphQLError("Betmate relationship not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    await this.prisma.friendship.delete({ where: { id: friendship.id } });
    return true;
  }

  /** Returns all accepted Betmates of the current user. */
  async getMyBetmates(currentUserId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: currentUserId, status: FriendshipStatus.ACCEPTED },
          { receiverId: currentUserId, status: FriendshipStatus.ACCEPTED },
        ],
      },
      include: { requester: true, receiver: true },
    });

    return friendships.map((f) =>
      f.requesterId === currentUserId ? f.receiver : f.requester,
    );
  }

  /** Returns pending Betmate requests received by the current user. */
  async getPendingFriendRequests(currentUserId: string) {
    return this.prisma.friendship.findMany({
      where: { receiverId: currentUserId, status: FriendshipStatus.PENDING },
      include: { requester: true, receiver: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Returns pending Betmate requests sent by the current user. */
  async getSentFriendRequests(currentUserId: string) {
    return this.prisma.friendship.findMany({
      where: { requesterId: currentUserId, status: FriendshipStatus.PENDING },
      include: { requester: true, receiver: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
