import { DeleteCredentialUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { DeleteCredentialInput } from "./abstractions.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";

class DeleteCredentialUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private credentials: CredentialsRepository.Interface) {}

    async execute(input: DeleteCredentialInput) {
        // No authorization here: the installer and `DeleteAdminUserUseCase` are the callers, and the
        // latter checks `adminUsers.user` before it gets this far.
        return this.credentials.delete({ userId: input.userId });
    }
}

export const DeleteCredentialUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteCredentialUseCaseImpl,
    dependencies: [CredentialsRepository]
});
