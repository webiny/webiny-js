import { Result } from "@webiny/feature/api";
import { z } from "zod";
import { SetPasswordUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { SetPasswordInput } from "./abstractions.js";
import { WeakPasswordError } from "~/api/domain/errors.js";
import { CredentialsStorageOperations } from "~/api/storage/abstractions.js";
import type { StorageCredential } from "~/api/storage/abstractions.js";
import { PasswordHasher } from "~/api/domain/crypto/PasswordHasher.js";

const passwordPolicy = z.string().min(8);

class SetPasswordUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private credentials: CredentialsStorageOperations.Interface,
        private passwordHasher: PasswordHasher.Interface
    ) {}

    async execute(input: SetPasswordInput): Promise<Result<true, UseCaseAbstraction.Error>> {
        // TODO(authz): when called from a "change password" flow, assert the
        // caller is `input.userId` (self-service) or holds `adminUsers.user`
        // (admin reset). The bootstrap/installer path intentionally skips this.

        const policy = passwordPolicy.safeParse(input.password);
        if (!policy.success) {
            return Result.fail(new WeakPasswordError("Password must be at least 8 characters."));
        }

        const passwordHash = await this.passwordHasher.hash(input.password);

        const existing = await this.credentials.getCredentialByUserId({
            tenant: input.tenant,
            userId: input.userId
        });

        const now = nowIso();
        const credential: StorageCredential = {
            tenant: input.tenant,
            userId: input.userId,
            email: input.email,
            passwordHash,
            createdOn: existing?.createdOn ?? now,
            updatedOn: now
        };

        await this.credentials.saveCredential({ credential });

        return Result.ok(true);
    }
}

// `new Date()` is used at call time (runtime), not in a workflow context.
const nowIso = () => new Date().toISOString();

export const SetPasswordUseCase = UseCaseAbstraction.createImplementation({
    implementation: SetPasswordUseCaseImpl,
    dependencies: [CredentialsStorageOperations, PasswordHasher]
});
