import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";

/** How many copies of "article" every model list appends. */
export const PADDING_MODEL_COUNT = 150;

/** Appends `PADDING_MODEL_COUNT` bindable copies of "article", named to sort after the real models. */
class PaddingListModels implements ListModelsUseCase.Interface {
    public constructor(private decoratee: ListModelsUseCase.Interface) {}

    public async execute(params?: ListModelsUseCase.Params): ListModelsUseCase.Return {
        const result = await this.decoratee.execute(params);
        if (result.isFail()) {
            return result;
        }
        const article = result.value.find(model => model.modelId === "article");
        if (!article) {
            return result;
        }
        const padding: CmsModel[] = Array.from({ length: PADDING_MODEL_COUNT }, (_, index) => {
            const suffix = String(index + 1).padStart(3, "0");
            return { ...article, modelId: `paddingModel${suffix}`, name: `Zz Padding ${suffix}` };
        });
        return Result.ok([...result.value, ...padding]);
    }
}

/** Every model list carries `PADDING_MODEL_COUNT` extra bindable models (`legacyPlugins`). */
export const padListModels = (container: Container) => {
    container.registerDecorator(
        ListModelsUseCase.createDecorator({ decorator: PaddingListModels, dependencies: [] })
    );
};
