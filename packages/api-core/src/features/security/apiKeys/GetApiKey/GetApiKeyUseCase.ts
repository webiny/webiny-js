import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetApiKey } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { ApiKey } from "../shared/types.js";
import { NotAuthorizedError } from "~/features/security/apiKeys/shared/errors.js";

export class GetApiKeyUseCase implements GetApiKey.Interface {
    private repository: ApiKeysRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(
        repository: ApiKeysRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(id: string): Promise<Result<ApiKey | null, GetApiKey.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.apiKey");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.repository.get(id);
    }
}

export const GetApiKeyUseCaseImpl = createImplementation({
    abstraction: GetApiKey,
    implementation: GetApiKeyUseCase,
    dependencies: [ApiKeysRepository, IdentityContext]
});
