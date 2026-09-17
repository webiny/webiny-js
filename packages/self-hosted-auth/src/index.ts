// Config-time extension for webiny.config.tsx (`<SelfHostedAuth />`).
export { SelfHostedAuth } from "./SelfHostedAuth.js";

export { SelfHostedAuthApiFeature } from "./api/SelfHostedAuthApiFeature.js";

// Storage seams — one abstraction per operation, implemented by database packages (`-sql`, …).
export * from "./api/storage/credentials/index.js";
export * from "./api/storage/passwordResetCodes/index.js";

// Crypto seams — override to swap the KDF (e.g. Argon2id) or token strategy.
// Hasher lives in @webiny/api-core (configurable via <Infra.Crypto.Hashing>); re-exported
// here for convenience so the auth module's crypto seams stay discoverable in one place.
export { Hasher } from "@webiny/api-core/features/hashing/index.js";
export { TokenIssuer, SELF_HOSTED_ISSUER } from "./api/domain/crypto/TokenIssuer.js";
export { CliResetTokenVerifier } from "./api/domain/crypto/CliResetTokenVerifier.js";
export { CLI_RESET_ISSUER, CLI_RESET_AUDIENCE } from "./shared/cliResetToken.js";

// Use cases — handy for installers/seeding scripts.
export { LoginUseCase } from "./api/features/Login/index.js";
export { SetPasswordUseCase } from "./api/features/SetPassword/index.js";
export { DeleteCredentialUseCase } from "./api/features/DeleteCredential/index.js";
export { CliResetPasswordUseCase } from "./api/features/CliResetPassword/index.js";
export { RequestPasswordResetUseCase } from "./api/features/RequestPasswordReset/index.js";
export { ResetPasswordWithCodeUseCase } from "./api/features/ResetPasswordWithCode/index.js";

// Reset-code seams — override to change the code format or how the code is delivered.
export { PasswordResetCodeGenerator } from "./api/domain/crypto/PasswordResetCodeGenerator.js";
export { PasswordResetMailer } from "./api/domain/mail/PasswordResetMailer.js";
