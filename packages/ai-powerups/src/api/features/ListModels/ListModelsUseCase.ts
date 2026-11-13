import { Result } from "@webiny/feature/api";
import { AiModelRegistry } from "@webiny/api-core/features/ai/index.js";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { ListModelsUseCase } from "./abstractions.js";

class ListModelsUseCaseImpl implements ListModelsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private registry: AiModelRegistry.Interface
    ) {}

    async execute(): Promise<Result<AiModel[], Error>> {
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }
        return Result.ok(await this.registry.listModels());
    }
}

export const ListModelsUseCaseImplementation = ListModelsUseCase.createImplementation({
    implementation: ListModelsUseCaseImpl,
    dependencies: [IdentityContext, AiModelRegistry]
});
