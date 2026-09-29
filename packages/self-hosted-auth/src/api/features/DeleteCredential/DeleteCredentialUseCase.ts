import { DeleteCredentialUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { DeleteCredentialInput } from "./abstractions.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";

class DeleteCredentialUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private credentials: CredentialsRepository.Interface) {}

    async execute(input: DeleteCredentialInput) {
        // TODO(authz): this is reachable only from the installer today. Assert the caller holds
        // `adminUsers.user` if it is ever wired to anything a request can reach.
        return this.credentials.delete({ userId: input.userId });
    }
}

export const DeleteCredentialUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteCredentialUseCaseImpl,
    dependencies: [CredentialsRepository]
});
