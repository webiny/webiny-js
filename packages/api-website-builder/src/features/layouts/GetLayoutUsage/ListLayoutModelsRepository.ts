import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { ListLayoutModelsRepository as RepositoryAbstraction } from "./abstractions.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";
import { LayoutModelSetting } from "~/domain/layout/LayoutModelSetting.js";

class ListLayoutModelsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private listModels: ListModelsUseCase.Interface
    ) {}

    async execute(slug: string): RepositoryAbstraction.Return {
        // A model the identity can't read still renders its entries in the layout.
        const result = await this.identityContext.withoutAuthorization(() =>
            this.listModels.execute()
        );
        if (result.isFail()) {
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        return Result.ok(
            result.value
                .filter(model => LayoutModelSetting.from(model).names(slug))
                .map(model => ({ modelId: model.modelId, name: model.name }))
        );
    }
}

export const ListLayoutModelsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListLayoutModelsRepositoryImpl,
    dependencies: [IdentityContext, ListModelsUseCase]
});
