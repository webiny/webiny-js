import { TokenRefreshGateway as Abstraction, CustomIdpConfig } from "./abstractions.js";

class TokenRefreshGatewayImpl implements Abstraction.Interface {
    constructor(private config: CustomIdpConfig.Interface) {}

    async refresh(refreshToken: string): Promise<Abstraction.Tokens> {
        const response = await fetch(`${this.config.refreshUrl}?token=${refreshToken}`, {
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.statusText}`);
        }

        const json = await response.json();
        return {
            idToken: json.idToken,
            refreshToken: json.refreshToken
        };
    }
}

export const TokenRefreshGateway = Abstraction.createImplementation({
    implementation: TokenRefreshGatewayImpl,
    dependencies: [CustomIdpConfig]
});
