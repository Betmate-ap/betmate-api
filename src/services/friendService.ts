import { PrismaClient, FriendshipStatus } from "@prisma/client";
import { GraphQLError } from "graphql";

export class FriendService {
  constructor(private prisma: PrismaClient) {}

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length < 2) {
      throw new GraphQLError("Search query must be at least 2 characters", {
        extensions: { code: "INVALID_INPUT" },
      });
    }

    const term = query.trim();

    // Find all users blocked by or blocking the current user
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

    // Fetch friendship status between current user and each result
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

    // Check for any existing friendship in either direction
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

  async blockUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new GraphQLError("Cannot block yourself", {
        extensions: { code: "INVALID_INPUT" },
      });
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: currentUserId },
        ],
      },
    });

    if (existing) {
      return this.prisma.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId: currentUserId,
          receiverId: targetUserId,
          status: FriendshipStatus.BLOCKED,
        },
        include: { requester: true, receiver: true },
      });
    }

    return this.prisma.friendship.create({
      data: {
        requesterId: currentUserId,
        receiverId: targetUserId,
        status: FriendshipStatus.BLOCKED,
      },
      include: { requester: true, receiver: true },
    });
  }

  async unblockUser(currentUserId: string, targetUserId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        requesterId: currentUserId,
        receiverId: targetUserId,
        status: FriendshipStatus.BLOCKED,
      },
    });

    if (!friendship) {
      throw new GraphQLError("No block found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    await this.prisma.friendship.delete({ where: { id: friendship.id } });
    return true;
  }

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

  async getPendingFriendRequests(currentUserId: string) {
    return this.prisma.friendship.findMany({
      where: { receiverId: currentUserId, status: FriendshipStatus.PENDING },
      include: { requester: true, receiver: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSentFriendRequests(currentUserId: string) {
    return this.prisma.friendship.findMany({
      where: { requesterId: currentUserId, status: FriendshipStatus.PENDING },
      include: { requester: true, receiver: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
