import { Result } from "@webiny/feature/api";
import { LoginUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { LoginInput, LoginOutput } from "./abstractions.js";
import { loginValidation } from "./schema.js";
import { InvalidCredentialsError } from "~/api/domain/errors.js";
import { CredentialsStorageOperations } from "~/api/storage/abstractions.js";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import { TokenIssuer } from "~/api/domain/crypto/TokenIssuer.js";

class LoginUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private credentials: CredentialsStorageOperations.Interface,
        private hasher: Hasher.Interface,
        private tokenIssuer: TokenIssuer.Interface
    ) {}

    async execute(input: LoginInput): Promise<Result<LoginOutput, UseCaseAbstraction.Error>> {
        // Shape-validate only. Every failure past this point returns the same
        // generic error so we never disclose whether the account exists.
        const validation = loginValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new InvalidCredentialsError());
        }

        const { email, password } = validation.data;

        // Credentials are global (email is the login key), mirroring Cognito's user pool. Tenant
        // membership is resolved by the security layer, not from the credential.
        const credential = await this.credentials.getCredentialByEmail({ email });
        if (!credential) {
            // Anti-enumeration: verify against a throwaway hash even though there is no account, so
            // the "no such user" path spends the same (deliberately slow) scrypt time as the
            // "wrong password" path below. Without this, an attacker could tell which emails are
            // registered by timing the response. Result is discarded — we always fail here.
            await this.hasher.verify(password, DUMMY_HASH);
            return Result.fail(new InvalidCredentialsError());
        }

        const ok = await this.hasher.verify(password, credential.passwordHash);
        if (!ok) {
            return Result.fail(new InvalidCredentialsError());
        }

        const issued = await this.tokenIssuer.issue({
            userId: credential.userId,
            email: credential.email
        });

        return Result.ok(issued);
    }
}

/**
 * A well-formed scrypt hash (`scrypt$N$r$p$salt$hash`) of a throwaway value, used only for the
 * timing-equalization step above. It must be *syntactically valid* so `hasher.verify` actually
 * parses it and runs the full (slow) KDF — a garbage string would bail out early and defeat the
 * purpose. It never matches any real password, so verifying against it always returns false; we
 * run it purely to spend the same CPU as a real password check.
 */
const DUMMY_HASH =
    "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" +
    "Y2xhdWRlLWR1bW15LWhhc2gtcGxhY2Vob2xkZXItbm90LWEtcmVhbC1zZWNyZXQtdmFsdWU=";

export const LoginUseCase = UseCaseAbstraction.createImplementation({
    implementation: LoginUseCaseImpl,
    dependencies: [CredentialsStorageOperations, Hasher, TokenIssuer]
});
