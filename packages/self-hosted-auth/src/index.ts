// Config-time extension for webiny.config.tsx (`<SelfHostedAuth />`).
export { SelfHostedAuth } from "./SelfHostedAuth.js";

export { SelfHostedAuthApiFeature } from "./api/SelfHostedAuthApiFeature.js";

// Storage seam — implemented by database packages (`-sql`, `-mdb`, …).
export {
    CredentialsStorageOperations,
    type StorageCredential
} from "./api/storage/abstractions.js";

// Crypto seams — override to swap the KDF (e.g. Argon2id) or token strategy.
// Hasher lives in @webiny/api-core (configurable via <Infra.Crypto.Hashing>); re-exported
// here for convenience so the auth module's crypto seams stay discoverable in one place.
export { Hasher } from "@webiny/api-core/features/hashing/index.js";
export { TokenIssuer, SELF_HOSTED_ISSUER } from "./api/domain/crypto/TokenIssuer.js";

// Use cases — handy for installers/seeding scripts.
export { LoginUseCase } from "./api/features/Login/index.js";
export { SetPasswordUseCase } from "./api/features/SetPassword/index.js";
