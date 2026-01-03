import { createAbstraction } from "@webiny/feature/admin";

export type AuthState =
  | "signIn"
  | "signedIn"
  | "signedOut"
  | "signedUp"
  | "verifyContact"
  | "confirmSignIn"
  | "requireNewPassword"
  | "setNewPassword"
  | "TOTPSetup"
  | "confirmSignUp"
  | "forgotPassword";

export interface AuthDataVerified {
  email?: string;
  phone_number?: string;
}

export interface AuthDataUnverified {
  email?: string;
  phone_number?: string;
}

export interface AuthData {
  username?: string;
  verified?: AuthDataVerified;
  unverified?: AuthDataUnverified;
  requiredAttributes?: string[];
  [key: string]:
    | string
    | null
    | boolean
    | undefined
    | string[]
    | AuthDataVerified
    | AuthDataUnverified;
}

export interface AuthMessage {
  title: string;
  text: string;
  type: "success" | "info" | "warning" | "danger";
}

export interface ICognitoInitParams {
  region: string;
  userPoolId: string;
  clientId: string;
}

export interface SignInVM {
  isLoading: boolean;
  message: AuthMessage | null;
}

export interface RequireNewPasswordVM {
  isLoading: boolean;
  requiredAttributes: string[];
}

export interface ForgotPasswordVM {
  isLoading: boolean;
  message: AuthMessage | null;
}

export interface SetNewPasswordVM {
  isLoading: boolean;
  message: AuthMessage | null;
}

export interface ICognitoPresenter {
  vm: {
    authState: AuthState;
    checkingUser: boolean;
    isAuthenticated: boolean;
    signIn: SignInVM;
    requireNewPassword: RequireNewPasswordVM;
    forgotPassword: ForgotPasswordVM;
    setNewPassword: SetNewPasswordVM;
  };

  // Lifecycle
  init(params: ICognitoInitParams): Promise<void>;

  // Authentication actions
  signIn(username: string, password: string): Promise<void>;
  confirmNewPassword(password: string, requiredAttributes: any): Promise<void>;
  requestPasswordReset(username: string): Promise<void>;
  confirmPasswordReset(
    username: string,
    code: string,
    password: string
  ): Promise<void>;

  // Navigation actions
  showSignIn(): void;
  showForgotPassword(): void;
}

export const CognitoPresenter = createAbstraction<ICognitoPresenter>(
  "CognitoPresenter"
);

export namespace CognitoPresenter {
  export type Interface = ICognitoPresenter;
}
