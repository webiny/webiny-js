import { createAbstraction } from "webiny/admin";

export interface ITokens {
    idToken: string;
    refreshToken: string;
}

export type ILogoutReason = "userAction" | "noRefreshToken" | "noTokens" | "tokenRefreshError";

// Presenter
export interface ICustomIdpVm {
    isIdpAuthenticated: boolean;
    isWebinyAuthenticated: boolean;
    isRefreshing: boolean;
}

export interface ICustomIdpPresenter {
    vm: ICustomIdpVm;
    init(tokensFromUrl?: ITokens): void;
    login(): void;
    destroy(): void;
}

export const CustomIdpPresenter = createAbstraction<ICustomIdpPresenter>("CustomIdpPresenter");

export namespace CustomIdpPresenter {
    export type Interface = ICustomIdpPresenter;
    export type ViewModel = ICustomIdpVm;
    export type Tokens = ITokens;
    export type LogoutReason = ILogoutReason;
}

// Repository
export interface ICustomIdpRepository {
    isAuthenticated(): boolean;
    getIdToken(): string | undefined;
    getRefreshToken(): string | undefined;
    setTokens(tokens: ITokens): void;
    clearTokens(): void;
}

export const CustomIdpRepository = createAbstraction<ICustomIdpRepository>("CustomIdpRepository");

export namespace CustomIdpRepository {
    export type Interface = ICustomIdpRepository;
    export type Tokens = ITokens;
}

// Gateways
export interface IJwtValidationGateway {
    isExpired(token: string): boolean;
    decode<T>(token: string): T;
}

export const JwtValidationGateway =
    createAbstraction<IJwtValidationGateway>("JwtValidationGateway");

export namespace JwtValidationGateway {
    export type Interface = IJwtValidationGateway;
}

export interface ITokenRefreshGateway {
    refresh(refreshToken: string): Promise<ITokens>;
}

export const TokenRefreshGateway = createAbstraction<ITokenRefreshGateway>("TokenRefreshGateway");

export namespace TokenRefreshGateway {
    export type Interface = ITokenRefreshGateway;
    export type Tokens = ITokens;
}

export interface IIdpRedirectGateway {
    redirectToLogin(tenantId: string, error?: string): void;
}

export const IdpRedirectGateway = createAbstraction<IIdpRedirectGateway>("IdpRedirectGateway");

export namespace IdpRedirectGateway {
    export type Interface = IIdpRedirectGateway;
}

// Configuration
export interface ICustomIdpConfig {
    loginUrl: string;
    refreshUrl: string;
    refreshIntervalSeconds: number;
}

export const CustomIdpConfig = createAbstraction<ICustomIdpConfig>("CustomIdpConfig");

export namespace CustomIdpConfig {
    export type Interface = ICustomIdpConfig;
}
