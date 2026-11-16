import { Result } from "@webiny/feature/api";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import { SendPasswordResetCodeUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { SendPasswordResetCodeInput } from "./abstractions.js";
import { PasswordResetDeliveryError } from "~/api/domain/errors.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";
import { PasswordResetCodesRepository } from "~/api/repositories/PasswordResetCodesRepository.js";
import { PasswordResetCodeGenerator } from "~/api/domain/crypto/PasswordResetCodeGenerator.js";
import { PasswordResetMailer } from "~/api/domain/mail/PasswordResetMailer.js";

class SendPasswordResetCodeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private credentials: CredentialsRepository.Interface,
        private codes: PasswordResetCodesRepository.Interface,
        private generator: PasswordResetCodeGenerator.Interface,
        private hasher: Hasher.Interface,
        private mailer: PasswordResetMailer.Interface
    ) {}

    async execute(
        input: SendPasswordResetCodeInput
    ): Promise<Result<UseCaseAbstraction.Outcome, UseCaseAbstraction.Error>> {
        const found = await this.credentials.getByEmail({ email: input.email });
        if (found.isFail()) {
            return Result.fail(found.error);
        }

        const credential = found.value;
        if (!credential) {
            // The row stays without a code and expires on its own.
            return Result.ok("noAccount");
        }

        const code = this.generator.generate();
        const codeHash = await this.hasher.hash(code);

        const stored = await this.codes.setCodeHash({ id: input.codeId, codeHash });
        if (stored.isFail()) {
            return Result.fail(stored.error);
        }

        if (!stored.value) {
            // The row is gone or already has a code. Mailing a code that was not stored would send
            // the user one that cannot work.
            return Result.ok("alreadyIssued");
        }

        const sent = await this.mailer.send({ email: credential.email, code });
        if (!sent) {
            return Result.fail(new PasswordResetDeliveryError());
        }

        return Result.ok("sent");
    }
}

export const SendPasswordResetCodeUseCase = UseCaseAbstraction.createImplementation({
    implementation: SendPasswordResetCodeUseCaseImpl,
    dependencies: [
        CredentialsRepository,
        PasswordResetCodesRepository,
        PasswordResetCodeGenerator,
        Hasher,
        PasswordResetMailer
    ]
});
