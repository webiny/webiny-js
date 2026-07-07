import { createFeature } from "@webiny/feature/api";
import { TokenIssuerFeature } from "./domain/crypto/TokenIssuer.js";
import { SelfHostedIdpFeature } from "./features/SelfHostedIdp/index.js";
import { LoginFeature } from "./features/Login/index.js";
import { SetPasswordFeature } from "./features/SetPassword/index.js";
import { UserInstallerFeature } from "./features/UserInstaller/index.js";
import { SelfHostedAuthSchema } from "./graphql/auth.gql.js";

/**
 * Wires the whole self-hosted auth module: crypto services, the JWT identity
 * provider (validation), the login/set-password use cases, and the public
 * GraphQL surface.
 *
 * The JWT signing secret and password hashing are configured via webiny.config.tsx
 * (`<SelfHostedAuth signingSecret={...}>` and `<Infra.Crypto.Hashing>`), read from
 * BuildParams by TokenIssuer / api-core's Hasher respectively.
 *
 * The credential *storage* is NOT registered here — pull in a database package
 * (`@webiny/self-hosted-auth-sql`, `-mdb`, …) that registers
 * `CredentialsStorageOperations`.
 */
export const SelfHostedAuthApiFeature = createFeature({
    name: "SelfHostedAuthApi",
    register(container) {
        TokenIssuerFeature.register(container);
        SelfHostedIdpFeature.register(container);
        LoginFeature.register(container);
        SetPasswordFeature.register(container);
        UserInstallerFeature.register(container);

        container.register(SelfHostedAuthSchema);
    }
});
