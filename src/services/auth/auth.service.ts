import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";
import { CryptoUtils } from "../../utils/crypto";
import { sanitizeUser } from "./types";
import type { SignupInput, LoginInput, AuthPayload } from "./types";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /** Creates a new account and returns auth tokens. */
  async signup(input: SignupInput): Promise<AuthPayload> {
    const { email, username, firstName, lastName, password } = input;

    this.validateSignupInput(input);

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new GraphQLError("User with this email already exists", {
          extensions: { code: "EMAIL_ALREADY_EXISTS" },
        });
      }
      if (existingUser.username === username) {
        throw new GraphQLError("Username already taken", {
          extensions: { code: "USERNAME_TAKEN" },
        });
      }
    }

    const hashedPassword = await CryptoUtils.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
        emailVerified: false,
      },
    });

    const accessToken = CryptoUtils.generateAccessToken(user.id);
    const refreshTokenString = CryptoUtils.generateRefreshToken(user.id);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: CryptoUtils.getRefreshTokenExpiry(),
      },
    });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  /** Authenticates with email/password and returns auth tokens. */
  async login(input: LoginInput): Promise<AuthPayload> {
    const { email, password } = input;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new GraphQLError("Invalid email or password", {
        extensions: { code: "INVALID_CREDENTIALS" },
      });
    }

    if (!user.isActive) {
      throw new GraphQLError("Account is deactivated", {
        extensions: { code: "ACCOUNT_DEACTIVATED" },
      });
    }

    const isValidPassword = await CryptoUtils.comparePassword(
      password,
      user.password,
    );
    if (!isValidPassword) {
      throw new GraphQLError("Invalid email or password", {
        extensions: { code: "INVALID_CREDENTIALS" },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const accessToken = CryptoUtils.generateAccessToken(user.id);
    const refreshTokenString = CryptoUtils.generateRefreshToken(user.id);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: CryptoUtils.getRefreshTokenExpiry(),
      },
    });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  /** Issues new tokens from a valid refresh token (token rotation). */
  async refreshToken(refreshToken: string): Promise<AuthPayload> {
    let decoded;
    try {
      decoded = CryptoUtils.verifyToken(refreshToken);
      if (decoded.type !== "refresh") throw new Error("Invalid token type");
    } catch {
      throw new GraphQLError("Invalid refresh token", {
        extensions: { code: "INVALID_REFRESH_TOKEN" },
      });
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new GraphQLError("Refresh token expired or invalid", {
        extensions: { code: "REFRESH_TOKEN_EXPIRED" },
      });
    }

    if (!storedToken.user.isActive) {
      throw new GraphQLError("Account is deactivated", {
        extensions: { code: "ACCOUNT_DEACTIVATED" },
      });
    }

    const newAccessToken = CryptoUtils.generateAccessToken(storedToken.userId);
    const newRefreshToken = CryptoUtils.generateRefreshToken(
      storedToken.userId,
    );

    // Replace old refresh token with new one (token rotation)
    await this.prisma.$transaction([
      this.prisma.refreshToken.delete({ where: { token: refreshToken } }),
      this.prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: storedToken.userId,
          expiresAt: CryptoUtils.getRefreshTokenExpiry(),
        },
      }),
    ]);

    return {
      user: sanitizeUser(storedToken.user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /** Invalidates the provided refresh token. */
  async logout(refreshToken: string): Promise<boolean> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return true;
  }

  private validateSignupInput(input: SignupInput): void {
    const { email, username, firstName, lastName, password } = input;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new GraphQLError("Invalid email format", {
        extensions: { code: "INVALID_EMAIL" },
      });
    }
    if (username.length < 3 || username.length > 30) {
      throw new GraphQLError("Username must be 3-30 characters", {
        extensions: { code: "INVALID_USERNAME" },
      });
    }
    if (firstName.length < 1 || lastName.length < 1) {
      throw new GraphQLError("First and last name are required", {
        extensions: { code: "INVALID_NAME" },
      });
    }
    if (password.length < 8) {
      throw new GraphQLError("Password must be at least 8 characters", {
        extensions: { code: "WEAK_PASSWORD" },
      });
    }
  }
}
