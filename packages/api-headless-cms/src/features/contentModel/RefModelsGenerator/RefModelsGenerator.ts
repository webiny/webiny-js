import {
    RefModelsGenerator as Abstraction,
    type IRefModelsGenerator,
    type RefModelMetadata
} from "./abstractions.js";
import { ModelToAstConverter } from "../ModelToAstConverter/abstractions.js";
import { ValuesSelectionGenerator } from "../ValuesSelectionGenerator/abstractions.js";
import { ModelsFetcher } from "../shared/abstractions.js";
import type {
    CmsModel,
    CmsModelFieldAstNode,
    CmsModelFieldAstNodeField,
    CmsModelFieldAstNodeCollection
} from "~/types/index.js";

class RefModelsGeneratorImpl implements IRefModelsGenerator {
    constructor(
        private readonly modelToAst: ModelToAstConverter.Interface,
        private readonly modelsFetcher: ModelsFetcher.Interface,
        private readonly valuesSelectionGenerator: ValuesSelectionGenerator.Interface
    ) {}

    async generate(model: CmsModel): Promise<Record<string, RefModelMetadata>> {
        const ast = this.modelToAst.toAst(model);
        const refModelIds = new Set<string>();

        for (const node of ast.children) {
            this.collectRefModelIds(node, refModelIds);
        }

        const result: Record<string, RefModelMetadata> = {};

        for (const modelId of refModelIds) {
            const fetchResult = await this.modelsFetcher.fetchById(modelId);
            if (fetchResult.isFail()) {
                continue;
            }

            const refModel = fetchResult.value;
            const valuesSelection = this.valuesSelectionGenerator.generate(refModel);

            result[modelId] = { valuesSelection };
        }

        return result;
    }

    private collectRefModelIds(node: CmsModelFieldAstNode, modelIds: Set<string>): void {
        if (node.type === "field") {
            this.collectFromFieldNode(node, modelIds);
        } else if (node.type === "collection") {
            this.collectFromCollectionNode(node, modelIds);
        }
    }

    private collectFromFieldNode(node: CmsModelFieldAstNodeField, modelIds: Set<string>): void {
        const { field, children } = node;

        if (field.type === "ref") {
            const models = field.settings?.models;
            if (Array.isArray(models)) {
                for (const refModel of models) {
                    if (refModel.modelId) {
                        modelIds.add(refModel.modelId);
                    }
                }
            }
            return;
        }

        for (const child of children) {
            this.collectRefModelIds(child, modelIds);
        }
    }

    private collectFromCollectionNode(
        node: CmsModelFieldAstNodeCollection,
        modelIds: Set<string>
    ): void {
        for (const child of node.children) {
            this.collectRefModelIds(child, modelIds);
        }
    }
}

export const RefModelsGenerator = Abstraction.createImplementation({
    implementation: RefModelsGeneratorImpl,
    dependencies: [ModelToAstConverter, ModelsFetcher, ValuesSelectionGenerator]
});
