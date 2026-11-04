import { ComposeLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListPageGlobalComponentsUseCase } from "~/features/globals/ListPageGlobalComponents/index.js";
import { ComposedPage } from "~/domain/page/ComposedPage.js";
import type { Layout } from "~/domain/layout/abstractions.js";

class ComposeLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private listPageGlobalComponents: ListPageGlobalComponentsUseCase.Interface) {}

    async execute(
        layout: Layout,
        options: UseCaseAbstraction.Options = {}
    ): UseCaseAbstraction.Return {
        const composed = ComposedPage.compose(
            { elements: {}, bindings: {} },
            { layout, globalComponents: await this.getGlobalComponents(options.language) }
        ).toJSON();

        return {
            elements: composed.elements,
            bindings: composed.bindings,
            layout: composed.layout ?? layout
        };
    }

    private async getGlobalComponents(language: string | null | undefined) {
        try {
            const result = await this.listPageGlobalComponents.execute({ language });
            return result.isOk() ? result.value : [];
        } catch {
            return [];
        }
    }
}

export const ComposeLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: ComposeLayoutUseCaseImpl,
    dependencies: [ListPageGlobalComponentsUseCase]
});
