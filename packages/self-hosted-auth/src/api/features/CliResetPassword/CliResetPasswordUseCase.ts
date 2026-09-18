import { Result } from "@webiny/feature/api";
import { CliResetPasswordUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { CliResetPasswordInput } from "./abstractions.js";
import { CredentialNotFoundForEmailError, InvalidResetTokenError } from "~/api/domain/errors.js";
import { CliResetTokenVerifier } from "~/api/domain/crypto/CliResetTokenVerifier.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";
import { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";

class CliResetPasswordUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private tokenVerifier: CliResetTokenVerifier.Interface,
        private credentials: CredentialsRepository.Interface,
        private setPasswordUseCase: SetPasswordUseCase.Interface
    ) {}

    async execute(input: CliResetPasswordInput): Promise<Result<true, UseCaseAbstraction.Error>> {
        const claims = this.tokenVerifier.verify(input.token);
        if (!claims) {
            return Result.fail(new InvalidResetTokenError());
        }

        // The token names the account, so the caller cannot redirect the reset at another
        // user by tampering with the request, only by minting a new token, which needs the
        // signing secret.
        const found = await this.credentials.getByEmail({ email: claims.email });
        if (found.isFail()) {
            return Result.fail(found.error);
        }

        const credential = found.value;
        if (!credential) {
            return Result.fail(new CredentialNotFoundForEmailError(claims.email));
        }

        // `SetPasswordUseCase` owns the password policy and the upsert. Its authorization is
        // the caller's job (see the TODO in its implementation). Here the verified token is it.
        return this.setPasswordUseCase.execute({
            userId: credential.userId,
            email: credential.email,
            password: input.password
        });
    }
}

export const CliResetPasswordUseCase = UseCaseAbstraction.createImplementation({
    implementation: CliResetPasswordUseCaseImpl,
    dependencies: [CliResetTokenVerifier, CredentialsRepository, SetPasswordUseCase]
});
