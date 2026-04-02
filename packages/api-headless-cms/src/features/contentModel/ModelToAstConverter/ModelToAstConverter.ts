import { ModelToAstConverter as ConverterAbstraction } from "./abstractions.js";
import {
    CmsModelFieldToAstConverterFromPlugins,
    CmsModelToAstConverter
} from "~/utils/contentModelAst/index.js";
import type { CmsModel, CmsModelAst } from "~/types/index.js";
import { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

/**
 * ModelToAstConverter implementation
 *
 * Wraps CmsModelToAstConverter and provides it with field type plugins
 * for converting models to AST representation (used for GraphQL schema generation)
 */
class ModelToAstConverterImpl implements ConverterAbstraction.Interface {
    public constructor(private readonly registry: CmsModelFieldToGraphQLRegistry.Interface) {}

    toAst(model: CmsModel): CmsModelAst {
        const fieldTypePlugins = this.registry.getAllAsPlugins();

        const converter = new CmsModelToAstConverter(
            new CmsModelFieldToAstConverterFromPlugins(fieldTypePlugins)
        );

        return converter.toAst(model);
    }
}

export const ModelToAstConverter = ConverterAbstraction.createImplementation({
    implementation: ModelToAstConverterImpl,
    dependencies: [CmsModelFieldToGraphQLRegistry]
});
