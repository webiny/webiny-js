import { ComposePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPageLayoutUseCase } from "~/features/layouts/GetPageLayout/index.js";
import { ListPageGlobalComponentsUseCase } from "~/features/globals/ListPageGlobalComponents/index.js";
import { ComposedPage } from "~/domain/page/ComposedPage.js";
import type { WbPage } from "~/domain/page/abstractions.js";

class ComposePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getPageLayout: GetPageLayoutUseCase.Interface,
        private listPageGlobalComponents: ListPageGlobalComponentsUseCase.Interface
    ) {}

    async execute(
        page: WbPage,
        options: UseCaseAbstraction.Options = {}
    ): UseCaseAbstraction.Return {
        const layout = await this.getLayout(page);

        if (options.raw) {
            return { ...page, layout };
        }

        return ComposedPage.compose(page, {
            layout,
            globalComponents: await this.getGlobalComponents(page)
        }).toJSON();
    }

    // Globals that can't be listed are delivered as none: the frontend renders them from their manifest defaults.
    private async getGlobalComponents(page: WbPage) {
        try {
            const result = await this.listPageGlobalComponents.execute({
                language: page.properties?.language
            });
            return result.isOk() ? result.value : [];
        } catch {
            return [];
        }
    }

    // A layout that can't be read is delivered as none: the frontend renders the page in its own layout.
    private async getLayout(page: WbPage) {
        const layoutId = page.properties?.layout;
        if (typeof layoutId !== "string" || !layoutId) {
            return null;
        }

        try {
            const result = await this.getPageLayout.execute({
                layoutId,
                language: page.properties?.language
            });
            return result.isOk() ? result.value : null;
        } catch {
            return null;
        }
    }
}

export const ComposePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: ComposePageUseCaseImpl,
    dependencies: [GetPageLayoutUseCase, ListPageGlobalComponentsUseCase]
});
