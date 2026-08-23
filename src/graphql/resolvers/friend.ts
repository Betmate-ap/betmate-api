import { FriendService } from "../../services/friend/friend.service";
import { BlockService } from "../../services/friend/block.service";
import { type Context, requireAuth } from "../context";

export const friendQueries = {
  myBetmates: async (_: unknown, __: unknown, ctx: Context) => {
    const userId = requireAuth(ctx);
    return new FriendService(ctx.prisma).getMyBetmates(userId);
  },

  pendingFriendRequests: async (_: unknown, __: unknown, ctx: Context) => {
    const userId = requireAuth(ctx);
    return new FriendService(ctx.prisma).getPendingFriendRequests(userId);
  },

  sentFriendRequests: async (_: unknown, __: unknown, ctx: Context) => {
    const userId = requireAuth(ctx);
    return new FriendService(ctx.prisma).getSentFriendRequests(userId);
  },

  blockedUsers: async (_: unknown, __: unknown, ctx: Context) => {
    const userId = requireAuth(ctx);
    return new BlockService(ctx.prisma).getBlockedUsers(userId);
  },

  searchUsers: async (
    _: unknown,
    { query }: { query: string },
    ctx: Context,
  ) => {
    const userId = requireAuth(ctx);
    return new FriendService(ctx.prisma).searchUsers(query, userId);
  },
};

export const friendMutations = {
  sendFriendRequest: async (
    _: unknown,
    { userId }: { userId: string },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    return new FriendService(ctx.prisma).sendFriendRequest(
      currentUserId,
      userId,
    );
  },

  acceptFriendRequest: async (
    _: unknown,
    { friendshipId }: { friendshipId: string },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    return new FriendService(ctx.prisma).acceptFriendRequest(
      friendshipId,
      currentUserId,
    );
  },

  declineFriendRequest: async (
    _: unknown,
    { friendshipId }: { friendshipId: string },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    return new FriendService(ctx.prisma).declineFriendRequest(
      friendshipId,
      currentUserId,
    );
  },

  removeBetmate: async (
    _: unknown,
    { userId }: { userId: string },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    return new FriendService(ctx.prisma).removeBetmate(currentUserId, userId);
  },

  blockUser: async (
    _: unknown,
    { userId }: { userId: string },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    await new BlockService(ctx.prisma).blockUser(currentUserId, userId);
    return true;
  },

  unblockUser: async (
    _: unknown,
    { userId }: { userId: string },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    return new BlockService(ctx.prisma).unblockUser(currentUserId, userId);
  },
};
