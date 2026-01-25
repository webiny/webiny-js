import type { Tokens } from "./types";

export class TokenManager {
    private readonly ID_TOKEN_KEY = "auth.idToken";
    private readonly REFRESH_TOKEN_KEY = "auth.refreshToken";

    public setTokens(tokens: Tokens): void {
        localStorage.setItem(this.ID_TOKEN_KEY, tokens.idToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    public getTokens(): Tokens | null {
        const idToken = localStorage.getItem(this.ID_TOKEN_KEY);
        const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

        if (!idToken || !refreshToken) {
            return null;
        }

        return { idToken, refreshToken };
    }

    public clearTokens(): void {
        localStorage.removeItem(this.ID_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
}
