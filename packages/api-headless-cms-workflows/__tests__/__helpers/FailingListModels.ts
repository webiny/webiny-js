import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { ModelPersistenceError } from "@webiny/api-headless-cms/domain/contentModel/errors.js";

class FailingListModels implements ListModelsUseCase.Interface {
    public constructor(private decoratee: ListModelsUseCase.Interface) {}

    public async execute(): ListModelsUseCase.Return {
        return Result.fail(new ModelPersistenceError(new Error("The model cache is down.")));
    }
}

/** Every model list fails with a persistence error, not `Cms/Model/NotAuthorized` (`legacyPlugins`). */
export const failListModels = (container: Container) => {
    container.registerDecorator(
        ListModelsUseCase.createDecorator({ decorator: FailingListModels, dependencies: [] })
    );
};
