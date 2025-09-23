import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";
import { CryptoUtils } from "../utils/crypto";

export interface SignupInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLogin: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * User signup with email/password
   */
  async signup(input: SignupInput): Promise<AuthPayload> {
    const { email, username, firstName, lastName, password } = input;

    // Validate input
    this.validateSignupInput(input);

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
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

    // Hash password
    const hashedPassword = await CryptoUtils.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
        emailVerified: false, // Will be verified via email
      },
    });

    // Generate tokens
    const accessToken = CryptoUtils.generateAccessToken(user.id);
    const refreshTokenString = CryptoUtils.generateRefreshToken(user.id);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: CryptoUtils.getRefreshTokenExpiry(),
      },
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  /**
   * User login with email/password
   */
  async login(input: LoginInput): Promise<AuthPayload> {
    const { email, password } = input;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new GraphQLError("Invalid email or password", {
        extensions: { code: "INVALID_CREDENTIALS" },
      });
    }

    // Check if user is active
    if (!user.isActive) {
      throw new GraphQLError("Account is deactivated", {
        extensions: { code: "ACCOUNT_DEACTIVATED" },
      });
    }

    // Verify password
    const isValidPassword = await CryptoUtils.comparePassword(
      password,
      user.password,
    );

    if (!isValidPassword) {
      throw new GraphQLError("Invalid email or password", {
        extensions: { code: "INVALID_CREDENTIALS" },
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const accessToken = CryptoUtils.generateAccessToken(user.id);
    const refreshTokenString = CryptoUtils.generateRefreshToken(user.id);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: CryptoUtils.getRefreshTokenExpiry(),
      },
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthPayload> {
    // Verify refresh token
    let decoded;
    try {
      decoded = CryptoUtils.verifyToken(refreshToken);
      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }
    } catch {
      throw new GraphQLError("Invalid refresh token", {
        extensions: { code: "INVALID_REFRESH_TOKEN" },
      });
    }

    // Check if refresh token exists in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new GraphQLError("Refresh token expired or invalid", {
        extensions: { code: "REFRESH_TOKEN_EXPIRED" },
      });
    }

    // Check if user is still active
    if (!storedToken.user.isActive) {
      throw new GraphQLError("Account is deactivated", {
        extensions: { code: "ACCOUNT_DEACTIVATED" },
      });
    }

    // Generate new tokens
    const newAccessToken = CryptoUtils.generateAccessToken(storedToken.userId);
    const newRefreshToken = CryptoUtils.generateRefreshToken(
      storedToken.userId,
    );

    // Replace old refresh token with new one (token rotation)
    await this.prisma.$transaction([
      this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      }),
      this.prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: storedToken.userId,
          expiresAt: CryptoUtils.getRefreshTokenExpiry(),
        },
      }),
    ]);

    return {
      user: this.sanitizeUser(storedToken.user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user by invalidating refresh token
   */
  async logout(refreshToken: string): Promise<boolean> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return true;
  }

  /**
   * Get user by ID (for "me" query)
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new GraphQLError("User not found", {
        extensions: { code: "USER_NOT_FOUND" },
      });
    }

    return this.sanitizeUser(user);
  }

  /**
   * Validate signup input
   */
  private validateSignupInput(input: SignupInput): void {
    const { email, username, firstName, lastName, password } = input;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new GraphQLError("Invalid email format", {
        extensions: { code: "INVALID_EMAIL" },
      });
    }

    // Username validation
    if (username.length < 3 || username.length > 30) {
      throw new GraphQLError("Username must be 3-30 characters", {
        extensions: { code: "INVALID_USERNAME" },
      });
    }

    // Name validation
    if (firstName.length < 1 || lastName.length < 1) {
      throw new GraphQLError("First and last name are required", {
        extensions: { code: "INVALID_NAME" },
      });
    }

    // Password validation
    if (password.length < 8) {
      throw new GraphQLError("Password must be at least 8 characters", {
        extensions: { code: "WEAK_PASSWORD" },
      });
    }
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Date | null;
    password?: string | null;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitizedUser } = user;
    return {
      ...sanitizedUser,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() || null,
    };
  }
}
