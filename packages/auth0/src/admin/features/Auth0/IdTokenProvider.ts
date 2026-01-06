import type { Auth0Client } from "@auth0/auth0-spa-js";

const EXPIRATION_BUFFER = 10;

export class IdTokenProvider {
    constructor(private auth0Client: Auth0Client) {}

    async getIdToken(): Promise<string> {
        // Check if token is expired
        const isExpired = await this.isTokenExpired();

        // Use the appropriate cache mode based on expiration
        const cacheMode = isExpired ? "off" : undefined;

        const response = await this.auth0Client.getTokenSilently({
            cacheMode,
            detailedResponse: true
        });

        return response.id_token || "";
    }

    private async isTokenExpired(): Promise<boolean> {
        try {
            const claims = await this.auth0Client.getIdTokenClaims();
            if (!claims || !claims.exp) {
                return true;
            }

            const now = Math.floor(Date.now() / 1000);

            return claims.exp < now + EXPIRATION_BUFFER;
        } catch {
            return true;
        }
    }
}
