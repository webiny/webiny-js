import { makeAutoObservable, runInAction } from "mobx";
import {
    CustomIdpPresenter as Abstraction,
    CustomIdpRepository,
    CustomIdpConfig,
    JwtValidationGateway,
    TokenRefreshGateway,
    IdpRedirectGateway
} from "./abstractions.js";
import { IdentityContext } from "webiny/admin/security";
import { LogInUseCase } from "webiny/admin/security";
import { TenantContext } from "webiny/admin/tenancy";

class CustomIdpPresenterImpl implements Abstraction.Interface {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private refreshing = false;

    constructor(
        private repository: CustomIdpRepository.Interface,
        private config: CustomIdpConfig.Interface,
        private identityContext: IdentityContext.Interface,
        private logInUseCase: LogInUseCase.Interface,
        private tenantContext: TenantContext.Interface,
        private jwtGateway: JwtValidationGateway.Interface,
        private refreshGateway: TokenRefreshGateway.Interface,
        private redirectGateway: IdpRedirectGateway.Interface
    ) {
        makeAutoObservable(this);
    }

    get vm(): Abstraction.ViewModel {
        return {
            isIdpAuthenticated: this.repository.isAuthenticated(),
            isWebinyAuthenticated: this.identityContext.getIdentity().isAuthenticated,
            isRefreshing: this.refreshing
        };
    }

    init(tokensFromUrl?: Abstraction.Tokens): void {
        if (tokensFromUrl) {
            this.repository.setTokens(tokensFromUrl);
        }

        this.initialize();
    }

    login() {
        this.redirectToLogin();
    }

    destroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    private async initialize(): Promise<void> {
        const idToken = this.repository.getIdToken();
        const refreshToken = this.repository.getRefreshToken();

        if (!idToken || !refreshToken) {
            this.redirectToLogin();
            return;
        }

        // Refresh if expired
        if (this.jwtGateway.isExpired(idToken)) {
            await this.refreshTokens();
        }

        // Call Webiny's LogInUseCase
        await this.logInUseCase.execute({
            idTokenProvider: () => this.repository.getIdToken(),
            logoutCallback: () => this.handleLogout("userAction")
        });

        // Start refresh loop
        this.startRefreshLoop();
    }

    private startRefreshLoop(): void {
        const intervalMs = this.config.refreshIntervalSeconds * 1000;
        this.intervalId = setInterval(() => {
            this.refreshTokens();
        }, intervalMs);
    }

    private async refreshTokens(): Promise<void> {
        if (this.refreshing) {
            return;
        }

        const refreshToken = this.repository.getRefreshToken();
        if (!refreshToken) {
            this.handleLogout("noRefreshToken");
            return;
        }

        try {
            this.setRefreshing(true);
            const freshTokens = await this.refreshGateway.refresh(refreshToken);
            this.repository.setTokens(freshTokens);
        } catch (err) {
            console.error("Token refresh failed:", err);
            this.handleLogout("tokenRefreshError");
        } finally {
            this.setRefreshing(false);
        }
    }

    private handleLogout(reason?: Abstraction.LogoutReason): void {
        this.repository.clearTokens();

        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        console.log("Logged out:", reason);
        // In case you want to redirect to your IDP login page, uncomment the following line:
        // this.redirectToLogin();
    }

    private redirectToLogin(): void {
        const tenantId = this.tenantContext.getCurrentTenant();
        this.redirectGateway.redirectToLogin(tenantId ?? "root");
    }

    private setRefreshing(flag: boolean): void {
        runInAction(() => {
            this.refreshing = flag;
        });
    }
}

export const CustomIdpPresenter = Abstraction.createImplementation({
    implementation: CustomIdpPresenterImpl,
    dependencies: [
        CustomIdpRepository,
        CustomIdpConfig,
        IdentityContext,
        LogInUseCase,
        TenantContext,
        JwtValidationGateway,
        TokenRefreshGateway,
        IdpRedirectGateway
    ]
});
