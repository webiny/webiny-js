import { createFeature } from "@webiny/feature/api";
import { TokenIssuerFeature } from "./domain/crypto/TokenIssuer.js";
import { CliResetTokenVerifierFeature } from "./domain/crypto/CliResetTokenVerifier.js";
import { SelfHostedIdpFeature } from "./features/SelfHostedIdp/index.js";
import { LoginFeature } from "./features/Login/index.js";
import { SetPasswordFeature } from "./features/SetPassword/index.js";
import { CliResetPasswordFeature } from "./features/CliResetPassword/index.js";
import { DeleteCredentialFeature } from "./features/DeleteCredential/index.js";
import { RequestPasswordResetFeature } from "./features/RequestPasswordReset/index.js";
import { ResetPasswordWithCodeFeature } from "./features/ResetPasswordWithCode/index.js";
import { CredentialsRepositoryFeature } from "./repositories/CredentialsRepository.js";
import { PasswordResetCodesRepositoryFeature } from "./repositories/PasswordResetCodesRepository.js";
import { PasswordResetCodeGeneratorFeature } from "./domain/crypto/PasswordResetCodeGenerator.js";
import { PasswordResetMailerFeature } from "./domain/mail/PasswordResetMailer.js";
import { UserInstallerFeature } from "./features/UserInstaller/index.js";
import { CreateAdminUserFeature } from "./features/CreateAdminUser/index.js";
import { UpdateAdminUserFeature } from "./features/UpdateAdminUser/index.js";
import { UpdateCurrentAdminUserFeature } from "./features/UpdateCurrentAdminUser/index.js";
import { DeleteAdminUserFeature } from "./features/DeleteAdminUser/index.js";
import { SelfHostedAuthSchema } from "./graphql/auth.gql.js";
import { SelfHostedAuthCliResetPasswordSchema } from "./graphql/cliResetPassword.gql.js";
import { SelfHostedAuthPasswordResetSchema } from "./graphql/passwordReset.gql.js";
import { SelfHostedAdminUsersSchema } from "./graphql/adminUsers.gql.js";

/**
 * Wires the whole self-hosted auth module: crypto services, the JWT identity
 * provider (validation), the login/set-password use cases, admin user management,
 * and the public GraphQL surface.
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
        CliResetTokenVerifierFeature.register(container);
        SelfHostedIdpFeature.register(container);
        LoginFeature.register(container);
        SetPasswordFeature.register(container);
        CliResetPasswordFeature.register(container);
        DeleteCredentialFeature.register(container);
        CredentialsRepositoryFeature.register(container);
        PasswordResetCodesRepositoryFeature.register(container);
        PasswordResetCodeGeneratorFeature.register(container);
        PasswordResetMailerFeature.register(container);
        RequestPasswordResetFeature.register(container);
        ResetPasswordWithCodeFeature.register(container);
        UserInstallerFeature.register(container);
        CreateAdminUserFeature.register(container);
        UpdateAdminUserFeature.register(container);
        UpdateCurrentAdminUserFeature.register(container);
        DeleteAdminUserFeature.register(container);

        container.register(SelfHostedAuthSchema);
        // Create, update and delete admin users, in the shape the admin app's Users screen expects.
        container.register(SelfHostedAdminUsersSchema);
        // Adds nothing to the schema when `<SelfHostedAuth cliPasswordReset={false} />` is set;
        // the flag is a build param, so it is read where BuildParams is resolvable (the schema
        // factory), not here at registration time.
        container.register(SelfHostedAuthCliResetPasswordSchema);
        // Same arrangement for the self-service flow: the flag is a build param, so the factory
        // reads it where BuildParams is resolvable rather than here.
        container.register(SelfHostedAuthPasswordResetSchema);
    }
});
