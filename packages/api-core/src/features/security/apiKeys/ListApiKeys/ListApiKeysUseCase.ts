import { Result } from "@webiny/feature/api";
import { ListApiKeysUseCase as ListApiKeysUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { listApiKeysInputSchema } from "../shared/schemas.js";
import type { ListApiKeysInput, ReadableApiKey } from "../shared/types.js";
import { ApiKeyNotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";
import { hideTokenUnlessFullAccess } from "../shared/hideToken.js";

class ListApiKeysUseCaseImpl implements ListApiKeysUseCaseAbstraction.Interface {
    private repository: ApiKeysRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(
        repository: ApiKeysRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(
        params: ListApiKeysInput = {}
    ): Promise<Result<ReadableApiKey[], ListApiKeysUseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.apiKey");
        if (!hasPermission) {
            return Result.fail(new ApiKeyNotAuthorizedError());
        }

        const validation = listApiKeysInputSchema.safeParse(params);
        if (!validation.success) {
            return Result.fail(new ApiKeyValidationError(validation.error.issues[0].message));
        }

        const result = await this.repository.list(validation.data);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(await hideTokenUnlessFullAccess(this.identityContext, result.value));
    }
}

export const ListApiKeysUseCase = ListApiKeysUseCaseAbstraction.createImplementation({
    implementation: ListApiKeysUseCaseImpl,
    dependencies: [ApiKeysRepository, IdentityContext]
});
