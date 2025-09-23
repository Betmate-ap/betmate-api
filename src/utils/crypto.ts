import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../lib/config";

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

export class CryptoUtils {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token (short-lived)
   */
  static generateAccessToken(userId: string): string {
    return jwt.sign({ userId, type: "access" }, config.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * Generate JWT refresh token (long-lived)
   */
  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: "refresh" }, config.JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): { userId: string; type: string } {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as {
        userId: string;
        type: string;
      };
      return { userId: decoded.userId, type: decoded.type };
    } catch {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Generate secure random token for email verification
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Calculate refresh token expiry date
   */
  static getRefreshTokenExpiry(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
}
