import { makeAutoObservable, runInAction } from "mobx";
import { TokenManager } from "./TokenManager";
import { JwtService } from "./JwtService";
import type { GoToLogin, GetFreshTokens, Tokens, OnLogout, LogoutReason } from "./types";

export class Authenticator {
    private readonly goToLogin: GoToLogin;
    private readonly getFreshTokens: GetFreshTokens;
    private readonly refreshInterval: number;
    private tokenManager = new TokenManager();
    private jwtService = new JwtService();
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private isAuthenticated = false;
    private refreshing = false;
    private onLogout: OnLogout;

    constructor(
        goToLogin: GoToLogin,
        getFreshTokens: GetFreshTokens,
        onLogout: OnLogout,
        refreshIntervalInSeconds: number
    ) {
        this.goToLogin = goToLogin;
        this.getFreshTokens = getFreshTokens;
        this.onLogout = onLogout;
        this.refreshInterval = refreshIntervalInSeconds * 1000;
        makeAutoObservable(this);
    }

    get vm() {
        return {
            isAuthenticated: this.isAuthenticated,
            isRefreshing: this.refreshing
        };
    }

    getIdToken() {
        const tokens = this.tokenManager.getTokens();

        return tokens?.idToken;
    }

    public init(tokens?: Tokens) {
        this.log("Authenticator.init", tokens);
        if (tokens) {
            this.tokenManager.setTokens(tokens);
        }

        this.initialize();
    }

    public destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    // Initialize authentication check and start refresh loop.
    private async initialize(): Promise<void> {
        const tokens = this.tokenManager.getTokens();

        if (!tokens) {
            this.setUnauthenticated();
            this.goToLogin();
            return;
        }

        const { idToken, refreshToken } = tokens;

        if (this.jwtService.isExpired(idToken)) {
            if (refreshToken) {
                await this.refreshTokens();
            } else {
                this.logout("noRefreshToken");
                return;
            }
        }

        this.setAuthenticated();

        this.startTokenRefreshLoop();
    }

    // Refresh tokens on a regular interval.
    private startTokenRefreshLoop(): void {
        this.log("Authenticator.startTokenRefreshLoop");
        this.intervalId = setInterval(() => {
            this.refreshTokens();
        }, this.refreshInterval);
    }

    // Refresh the tokens and update state accordingly.
    private async refreshTokens(): Promise<void> {
        if (this.refreshing) {
            return;
        }

        const tokens = this.tokenManager.getTokens();

        if (!tokens) {
            this.logout("noTokens");
            return;
        }

        try {
            this.log("Authenticator.refreshTokens");
            this.setRefreshing(true);
            const freshTokens = await this.getFreshTokens(tokens.refreshToken);
            this.tokenManager.setTokens(freshTokens);
            this.setAuthenticated();
        } catch (err) {
            this.log("Authenticator.refreshTokens.error", err);
            runInAction(() => {
                this.logout("tokenRefreshError");
            });
        } finally {
            this.setRefreshing(false);
        }
    }

    // Force logout the user and redirect.
    public logout(reason?: LogoutReason): void {
        this.log("Authenticator.logout");
        this.tokenManager.clearTokens();
        this.setUnauthenticated();

        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.onLogout(reason);
    }

    private setAuthenticated(): void {
        runInAction(() => {
            this.isAuthenticated = true;
        });
    }

    private setUnauthenticated(): void {
        runInAction(() => {
            this.isAuthenticated = false;
        });
    }

    private setRefreshing(flag: boolean): void {
        runInAction(() => {
            this.refreshing = flag;
        });
    }

    private log(...msg: any[]): void {
        if (process.env.NODE_ENV === "development") {
            console.log(...msg);
        }
    }
}
