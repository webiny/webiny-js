import { Result } from "@webiny/feature/api";
import { AiModelRegistry } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { ListModelsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private registry: AiModelRegistry.Interface
    ) {}

    public async execute(): UseCaseAbstraction.Return {
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        return Result.ok(await this.registry.listModels());
    }
}

export const ListModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListModelsUseCaseImpl,
    dependencies: [IdentityContext, AiModelRegistry]
});
