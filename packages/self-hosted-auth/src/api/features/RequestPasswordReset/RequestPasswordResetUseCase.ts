import { Result } from "@webiny/feature/api";
import { mdbid } from "@webiny/utils";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { RequestPasswordResetUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { RequestPasswordResetInput } from "./abstractions.js";
import { MailerNotConfiguredError } from "~/api/domain/errors.js";
import { TooManyResetRequestsError } from "~/api/domain/errors.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";
import { PasswordResetCodesRepository } from "~/api/repositories/PasswordResetCodesRepository.js";
import type { StoredPasswordResetCode } from "~/api/storage/passwordResetCodes.js";
import { PasswordResetCodeGenerator } from "~/api/domain/crypto/PasswordResetCodeGenerator.js";
import { PasswordResetMailer } from "~/api/domain/mail/PasswordResetMailer.js";
import { normalizeResetEmail } from "~/api/domain/normalizeResetEmail.js";
import { RESET_CODE_TTL_MINUTES } from "~/api/domain/passwordResetPolicy.js";
import { RESET_REQUESTS_PER_WINDOW } from "~/api/domain/passwordResetPolicy.js";
import { RESET_REQUEST_WINDOW_MINUTES } from "~/api/domain/passwordResetPolicy.js";

class RequestPasswordResetUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private codes: PasswordResetCodesRepository.Interface,
        private credentials: CredentialsRepository.Interface,
        private generator: PasswordResetCodeGenerator.Interface,
        private hasher: Hasher.Interface,
        private mailer: PasswordResetMailer.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(
        input: RequestPasswordResetInput
    ): Promise<Result<true, UseCaseAbstraction.Error>> {
        const email = input.email.trim();
        const key = normalizeResetEmail(email);

        // Asked first, and asked without reference to the address, so that an installation with no
        // mail answers the same way for every address anyone types in.
        const canSendMail = await this.mailer.isConfigured();
        if (!canSendMail) {
            return Result.fail(new MailerNotConfiguredError());
        }

        const now = new Date();

        const windowStart = new Date(now.getTime() - RESET_REQUEST_WINDOW_MINUTES * 60_000);
        const recentRequests = await this.codes.countRequestsSince({
            email: key,
            since: windowStart.toISOString()
        });

        if (recentRequests.isFail()) {
            return Result.fail(recentRequests.error);
        }

        if (recentRequests.value >= RESET_REQUESTS_PER_WINDOW) {
            return Result.fail(new TooManyResetRequestsError());
        }

        // Generated, hashed and stored for every address, including addresses with no account. The
        // row is what the request limit counts, so writing it only for real accounts would make the
        // limit itself answer the question the identical responses refuse to answer. Spending the
        // hash either way also keeps the two paths costing roughly the same, the way `LoginUseCase`
        // verifies against a throwaway hash for an unknown user.
        const code = this.generator.generate();
        const codeHash = await this.hasher.hash(code);

        const expiresOn = new Date(now.getTime() + RESET_CODE_TTL_MINUTES * 60_000);

        const stored: StoredPasswordResetCode = {
            id: mdbid(),
            email: key,
            codeHash,
            createdOn: now.toISOString(),
            expiresOn: expiresOn.toISOString(),
            usedOn: null,
            attempts: 0
        };

        const issued = await this.codes.issue({ code: stored });
        if (issued.isFail()) {
            return Result.fail(issued.error);
        }

        // Looked up with the address as typed, because that is how `LoginUseCase` looks it up. A
        // user whose case does not match cannot sign in either, so the two agree.
        const found = await this.credentials.getByEmail({ email });
        if (found.isFail()) {
            return Result.fail(found.error);
        }

        const credential = found.value;
        if (credential) {
            const sent = await this.mailer.send({ email: credential.email, code });

            if (!sent) {
                // Not reported to the caller. A delivery failure only ever happens for an address
                // that has an account, so surfacing it would say plainly which addresses those are.
                // The operator gets it from the log, where the user cannot see it.
                this.logger.error(
                    { email: credential.email },
                    "Could not deliver a password reset code."
                );
            }
        }

        return Result.ok(true);
    }
}

export const RequestPasswordResetUseCase = UseCaseAbstraction.createImplementation({
    implementation: RequestPasswordResetUseCaseImpl,
    dependencies: [
        PasswordResetCodesRepository,
        CredentialsRepository,
        PasswordResetCodeGenerator,
        Hasher,
        PasswordResetMailer,
        Logger
    ]
});
