import { Result } from "@webiny/feature/api";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import { ResetPasswordWithCodeUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { ResetPasswordWithCodeInput } from "./abstractions.js";
import { InvalidResetCodeError } from "~/api/domain/errors.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";
import { PasswordResetCodesRepository } from "~/api/repositories/PasswordResetCodesRepository.js";
import { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";
import { normalizeResetEmail } from "~/api/domain/normalizeResetEmail.js";
import { RESET_CODE_MAX_ATTEMPTS } from "~/api/domain/passwordResetPolicy.js";

class ResetPasswordWithCodeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private codes: PasswordResetCodesRepository.Interface,
        private credentials: CredentialsRepository.Interface,
        private hasher: Hasher.Interface,
        private setPasswordUseCase: SetPasswordUseCase.Interface
    ) {}

    async execute(
        input: ResetPasswordWithCodeInput
    ): Promise<Result<true, UseCaseAbstraction.Error>> {
        const email = input.email.trim();
        const key = normalizeResetEmail(email);
        const now = new Date().toISOString();

        const liveCodes = await this.codes.listLive({ email: key, now });
        if (liveCodes.isFail()) {
            return Result.fail(liveCodes.error);
        }

        for (const candidate of liveCodes.value) {
            // A code that has been guessed at its limit is finished, even though it has not expired
            // and has not been spent. Six digits only holds up because of this line.
            if (candidate.attempts >= RESET_CODE_MAX_ATTEMPTS) {
                continue;
            }

            const matches = await this.hasher.verify(input.code, candidate.codeHash);
            if (!matches) {
                // Read-modify-write is avoided here on purpose: two wrong guesses arriving together
                // must not both read the same count and write back the same number, or the cap
                // would be a suggestion.
                await this.codes.recordFailedAttempt({ id: candidate.id });
                continue;
            }

            return await this.setPassword({ email, key, password: input.password, now });
        }

        return Result.fail(new InvalidResetCodeError());
    }

    private async setPassword(params: {
        /** The address as typed, which is how credentials are keyed. */
        email: string;
        /** The normalized key the code rows are stored under. */
        key: string;
        password: string;
        now: string;
    }): Promise<Result<true, UseCaseAbstraction.Error>> {
        const { email, key, password, now } = params;

        const found = await this.credentials.getByEmail({ email });
        if (found.isFail()) {
            return Result.fail(found.error);
        }

        const credential = found.value;
        if (!credential) {
            // A code exists for an address with no account, which is the ordinary outcome of
            // somebody requesting a reset for an address that was never registered. Reported as an
            // invalid code, the same as every other failure on this path.
            return Result.fail(new InvalidResetCodeError());
        }

        // `SetPasswordUseCase` owns the password policy and the write. A verified code is the
        // authorization, the way a verified token is on the CLI path.
        const result = await this.setPasswordUseCase.execute({
            userId: credential.userId,
            email: credential.email,
            password
        });

        if (result.isFail()) {
            // The code was right, the new password was not. Leaving the code alive lets the user
            // pick a better one without going back to their inbox.
            return result;
        }

        // Spent on success, along with every other live code for the address, so that an earlier
        // message still sitting in the mailbox stops being a way in.
        const spent = await this.codes.spendAllForEmail({ email: key, usedOn: now });
        if (spent.isFail()) {
            return Result.fail(spent.error);
        }

        return Result.ok(true);
    }
}

export const ResetPasswordWithCodeUseCase = UseCaseAbstraction.createImplementation({
    implementation: ResetPasswordWithCodeUseCaseImpl,
    dependencies: [PasswordResetCodesRepository, CredentialsRepository, Hasher, SetPasswordUseCase]
});
