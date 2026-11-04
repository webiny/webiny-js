import type { Container } from "@webiny/di";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";

class ThrowingListModels implements ListModelsUseCase.Interface {
    public constructor(private decoratee: ListModelsUseCase.Interface) {}

    public async execute(): ListModelsUseCase.Return {
        throw new Error("The model cache is down.");
    }
}

/** Every model list throws, as a failed model cache load does (`legacyPlugins`). */
export const throwOnListModels = (container: Container) => {
    container.registerDecorator(
        ListModelsUseCase.createDecorator({ decorator: ThrowingListModels, dependencies: [] })
    );
};
