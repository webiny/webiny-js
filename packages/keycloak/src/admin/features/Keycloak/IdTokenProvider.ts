import type Keycloak from "keycloak-js";

const EXPIRATION_BUFFER_SECONDS = 10;

/**
 * Returns the ID token suitable for the api's `Authorization: Bearer`
 * header. Mirrors `@webiny/auth0`'s IdTokenProvider but uses keycloak-js
 * primitives — `tokenParsed.exp` for expiry, `updateToken(buffer)` to
 * refresh, `idToken` to read the latest value.
 */
export class IdTokenProvider {
    constructor(private keycloak: Keycloak) {}

    async getIdToken(): Promise<string> {
        if (this.isTokenExpired()) {
            // updateToken throws if the refresh fails — propagate so the
            // caller can re-authenticate.
            await this.keycloak.updateToken(EXPIRATION_BUFFER_SECONDS);
        }
        return this.keycloak.idToken ?? "";
    }

    private isTokenExpired(): boolean {
        const exp = this.keycloak.tokenParsed?.exp;
        if (!exp) {
            return true;
        }
        const now = Math.floor(Date.now() / 1000);
        return exp < now + EXPIRATION_BUFFER_SECONDS;
    }
}
