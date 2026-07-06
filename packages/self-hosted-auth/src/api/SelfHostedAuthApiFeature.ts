import { createFeature } from "@webiny/feature/api";
import { TokenIssuerFeature } from "./domain/crypto/TokenIssuer.js";
import type { TokenIssuerConfig } from "./domain/crypto/TokenIssuer.js";
import { SelfHostedIdpFeature } from "./features/SelfHostedIdp/index.js";
import { LoginFeature } from "./features/Login/index.js";
import { SetPasswordFeature } from "./features/SetPassword/index.js";
import { UserInstallerFeature } from "./features/UserInstaller/index.js";
import { SelfHostedAuthSchema } from "./graphql/auth.gql.js";

export interface SelfHostedAuthConfig {
    /** JWT signing secret. Falls back to `WEBINY_SELF_HOSTED_AUTH_SECRET`. */
    secret?: string;
    /** Token lifetime in seconds. */
    expiresIn?: number;
}

/**
 * Wires the whole self-hosted auth module: crypto services, the JWT identity
 * provider (validation), the login/set-password use cases, and the public
 * GraphQL surface.
 *
 * The credential *storage* is NOT registered here — pull in a database package
 * (`@webiny/self-hosted-auth-sql`, `-mdb`, …) that registers
 * `CredentialsStorageOperations`.
 */
export const SelfHostedAuthApiFeature = createFeature<SelfHostedAuthConfig | undefined>({
    name: "SelfHostedAuthApi",
    register(container, config) {
        const secret = config?.secret ?? process.env.WEBINY_SELF_HOSTED_AUTH_SECRET;
        if (!secret) {
            throw new Error(
                "SelfHostedAuthApiFeature: a signing `secret` is required " +
                    "(pass it in config or set WEBINY_SELF_HOSTED_AUTH_SECRET)."
            );
        }

        const tokenIssuerConfig: TokenIssuerConfig = { secret, expiresIn: config?.expiresIn };

        // The Hasher is provided by api-core (ApiCoreFeature → HasherFeature),
        // configurable via <Infra.Crypto.Hashing> in webiny.config.tsx.
        TokenIssuerFeature.register(container, tokenIssuerConfig);
        SelfHostedIdpFeature.register(container);
        LoginFeature.register(container);
        SetPasswordFeature.register(container);
        UserInstallerFeature.register(container);

        container.register(SelfHostedAuthSchema);
    }
});
