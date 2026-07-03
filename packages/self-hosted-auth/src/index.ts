export {
    SelfHostedAuthApiFeature,
    type SelfHostedAuthConfig
} from "./api/SelfHostedAuthApiFeature.js";

// Storage seam — implemented by database packages (`-sql`, `-mdb`, …).
export {
    CredentialsStorageOperations,
    type StorageCredential
} from "./api/storage/abstractions.js";

// Crypto seams — override to swap the KDF (e.g. Argon2id) or token strategy.
export { PasswordHasher } from "./api/domain/crypto/PasswordHasher.js";
export { TokenIssuer, SELF_HOSTED_ISSUER } from "./api/domain/crypto/TokenIssuer.js";

// Use cases — handy for installers/seeding scripts.
export { LoginUseCase } from "./api/features/Login/index.js";
export { SetPasswordUseCase } from "./api/features/SetPassword/index.js";
