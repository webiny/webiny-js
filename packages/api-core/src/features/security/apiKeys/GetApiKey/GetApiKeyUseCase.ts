import { Result } from "@webiny/feature/api";
import { GetApiKeyUseCase as GetApiKeyUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { ReadableApiKey } from "../shared/types.js";
import { ApiKeyNotAuthorizedError } from "~/features/security/apiKeys/shared/errors.js";
import { hideTokenUnlessFullAccess } from "../shared/hideToken.js";

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

    async execute(id: string): Promise<Result<ReadableApiKey, GetApiKeyUseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.apiKey");
        if (!hasPermission) {
            return Result.fail(new ApiKeyNotAuthorizedError());
        }

        const result = await this.repository.get(id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const [apiKey] = await hideTokenUnlessFullAccess(this.identityContext, [result.value]);
        return Result.ok(apiKey);
    }
}

export const GetApiKeyUseCase = GetApiKeyUseCaseAbstraction.createImplementation({
    implementation: GetApiKeyUseCaseImpl,
    dependencies: [ApiKeysRepository, IdentityContext]
});
