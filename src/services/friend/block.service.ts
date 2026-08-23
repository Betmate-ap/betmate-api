import { PrismaClient, FriendshipStatus } from "@prisma/client";
import { GraphQLError } from "graphql";

export class BlockService {
  constructor(private prisma: PrismaClient) {}

  /** Blocks a user. If a friendship already exists it is repurposed as a block record. */
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

  /** Removes a block; the relationship record is fully deleted. */
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

  /** Returns all users the current user has blocked. */
  async getBlockedUsers(currentUserId: string) {
    const blocks = await this.prisma.friendship.findMany({
      where: { requesterId: currentUserId, status: FriendshipStatus.BLOCKED },
      include: { receiver: true },
    });
    return blocks.map((b) => b.receiver);
  }
}
