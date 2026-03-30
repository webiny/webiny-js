import { ContentEntryTraverserProvider as ProviderAbstraction } from "./abstractions.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/abstractions.js";
import { ModelToAstConverter } from "~/features/contentModel/ModelToAstConverter/abstractions.js";
import { ContentEntryTraverser } from "./ContentEntryTraverser.js";
import type { IContentEntryTraverser } from "./ContentEntryTraverser.js";

class ContentEntryTraverserProviderImpl implements ProviderAbstraction.Interface {
    public constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private modelToAstConverter: ModelToAstConverter.Interface
    ) {}

    async getTraverser(modelId: string): Promise<IContentEntryTraverser> {
        const result = await this.getModelUseCase.execute(modelId);

        if (result.isFail()) {
            throw new Error(`Missing "${modelId}" model!`);
        }

        const model = result.value;
        const modelAst = this.modelToAstConverter.toAst(model);
        return new ContentEntryTraverser(modelAst);
    }
}

export const ContentEntryTraverserProvider = ProviderAbstraction.createImplementation({
    implementation: ContentEntryTraverserProviderImpl,
    dependencies: [GetModelUseCase, ModelToAstConverter]
});
