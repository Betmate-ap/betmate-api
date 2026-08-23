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

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  isActive: boolean;
  points: number;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface AuthPayload {
  user: SanitizedUser;
  accessToken: string;
  refreshToken: string;
}

export function sanitizeUser(user: {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  isActive: boolean;
  points: number;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  password?: string | null;
}): SanitizedUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return {
    ...rest,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString() || null,
  };
}
