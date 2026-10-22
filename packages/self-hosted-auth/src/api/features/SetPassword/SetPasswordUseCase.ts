import { Result } from "@webiny/feature/api";
import { SetPasswordUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { SetPasswordInput } from "./abstractions.js";
import { WeakPasswordError } from "~/api/domain/errors.js";
import { passwordPolicy } from "~/api/domain/passwordPolicy.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";
import type { StorageCredential } from "~/api/storage/credentials/index.js";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";

class SetPasswordUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private credentials: CredentialsRepository.Interface,
        private hasher: Hasher.Interface
    ) {}

    async execute(input: SetPasswordInput): Promise<Result<true, UseCaseAbstraction.Error>> {
        /*
         * No authorization here: the callers own it. The admin user use cases check
         * `adminUsers.user` (or that the caller is changing their own account), and the
         * installer and the reset flows have their own proof of who is asking.
         */

        const policy = passwordPolicy.safeParse(input.password);
        if (!policy.success) {
            return Result.fail(new WeakPasswordError("Password must be at least 8 characters."));
        }

        const passwordHash = await this.hasher.hash(input.password);

        const found = await this.credentials.getByUserId({ userId: input.userId });
        if (found.isFail()) {
            return Result.fail(found.error);
        }

        const existing = found.value;

        const now = nowIso();
        const credential: StorageCredential = {
            userId: input.userId,
            email: input.email,
            passwordHash,
            createdOn: existing?.createdOn ?? now,
            updatedOn: now
        };

        const saved = await this.credentials.save({ credential });
        if (saved.isFail()) {
            return Result.fail(saved.error);
        }

        return Result.ok(true);
    }
}

// `new Date()` is used at call time (runtime), not in a workflow context.
const nowIso = () => new Date().toISOString();

export const SetPasswordUseCase = UseCaseAbstraction.createImplementation({
    implementation: SetPasswordUseCaseImpl,
    dependencies: [CredentialsRepository, Hasher]
});
