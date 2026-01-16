import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListApiKeys } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { listApiKeysInputSchema } from "../shared/schemas.js";
import type { ApiKey, ListApiKeysInput } from "../shared/types.js";
import { ApiKeyNotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";

export class ListApiKeysUseCase implements ListApiKeys.Interface {
    private repository: ApiKeysRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(
        repository: ApiKeysRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(params: ListApiKeysInput = {}): Promise<Result<ApiKey[], ListApiKeys.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.apiKey");
        if (!hasPermission) {
            return Result.fail(new ApiKeyNotAuthorizedError());
        }

        const validation = listApiKeysInputSchema.safeParse(params);
        if (!validation.success) {
            return Result.fail(new ApiKeyValidationError(validation.error.errors[0].message));
        }

        return this.repository.list(validation.data);
    }
}

export const ListApiKeysUseCaseImpl = createImplementation({
    abstraction: ListApiKeys,
    implementation: ListApiKeysUseCase,
    dependencies: [ApiKeysRepository, IdentityContext]
});
