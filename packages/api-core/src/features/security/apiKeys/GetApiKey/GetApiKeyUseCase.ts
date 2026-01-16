import { Result } from "@webiny/feature/api";
import { GetApiKeyUseCase as GetApiKeyUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { ApiKey } from "../shared/types.js";
import { ApiKeyNotAuthorizedError } from "~/features/security/apiKeys/shared/errors.js";

class GetApiKeyUseCaseImpl implements GetApiKeyUseCaseAbstraction.Interface {
    private repository: ApiKeysRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(
        repository: ApiKeysRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(id: string): Promise<Result<ApiKey | null, GetApiKeyUseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.apiKey");
        if (!hasPermission) {
            return Result.fail(new ApiKeyNotAuthorizedError());
        }

        return this.repository.get(id);
    }
}

export const GetApiKeyUseCase = GetApiKeyUseCaseAbstraction.createImplementation({
    implementation: GetApiKeyUseCaseImpl,
    dependencies: [ApiKeysRepository, IdentityContext]
});
