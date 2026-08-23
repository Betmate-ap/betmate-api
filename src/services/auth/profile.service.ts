import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";
import { CryptoUtils } from "../../utils/crypto";
import { sanitizeUser } from "./types";
import type { UpdateProfileInput, ChangePasswordInput } from "./types";

export class ProfileService {
  constructor(private prisma: PrismaClient) {}

  /** Returns the user's profile by ID. Throws if not found or deactivated. */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw new GraphQLError("User not found", {
        extensions: { code: "USER_NOT_FOUND" },
      });
    }

    return sanitizeUser(user);
  }

  /** Updates profile fields. Only provided fields are changed (partial update). */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { firstName, lastName, username } = input;

    if (username !== undefined) {
      if (username.length < 3 || username.length > 30) {
        throw new GraphQLError("Username must be 3-30 characters", {
          extensions: { code: "INVALID_USERNAME" },
        });
      }
      const taken = await this.prisma.user.findFirst({
        where: { username, NOT: { id: userId } },
      });
      if (taken) {
        throw new GraphQLError("Username already taken", {
          extensions: { code: "USERNAME_TAKEN" },
        });
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(username !== undefined && { username }),
      },
    });

    return sanitizeUser(updated);
  }

  /** Changes the user's password and invalidates all existing sessions. */
  async changePassword(userId: string, input: ChangePasswordInput) {
    const { currentPassword, newPassword } = input;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.password) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const valid = await CryptoUtils.comparePassword(
      currentPassword,
      user.password,
    );
    if (!valid) {
      throw new GraphQLError("Current password is incorrect", {
        extensions: { code: "INVALID_CREDENTIALS" },
      });
    }

    if (newPassword.length < 8) {
      throw new GraphQLError("Password must be at least 8 characters", {
        extensions: { code: "WEAK_PASSWORD" },
      });
    }

    if (currentPassword === newPassword) {
      throw new GraphQLError(
        "New password must be different from current password",
        {
          extensions: { code: "SAME_PASSWORD" },
        },
      );
    }

    const hashed = await CryptoUtils.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    // Invalidate all refresh tokens — forces re-login on other devices
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return true;
  }
}
