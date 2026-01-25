export type IdentityData = {
  id: string;
  type: string;
  displayName: string;
  [key: string]: any;
};

export type ApiError = {
  message: string;
  code: "TokenExpiredError" | "JsonWebTokenError" | "NotBeforeError" | (string & {});
  data: Record<string, unknown>;
};

export type Tokens = { idToken: string; refreshToken: string };

export type GoToLogin = () => void;

export type GetFreshTokens = (refreshToken: string) => Promise<Tokens>;

export type OnLogout = (reason?: LogoutReason) => void;

export type LogoutReason = "userAction" | "noRefreshToken" | "noTokens" | "tokenRefreshError";
