import { ModelToAstConverter as ConverterAbstraction } from "./abstractions.js";
import {
    CmsModelToAstConverter,
    CmsModelFieldToAstConverterFromPlugins
} from "~/utils/contentModelAst/index.js";
import type { CmsModel, CmsModelAst, CmsModelFieldToGraphQLPlugin } from "~/types/index.js";
import { PluginsContainer } from "~/legacy/abstractions.js";

/**
 * ModelToAstConverter implementation
 *
 * Wraps CmsModelToAstConverter and provides it with field type plugins
 * for converting models to AST representation (used for GraphQL schema generation)
 */
class ModelToAstConverterImpl implements ConverterAbstraction.Interface {
    constructor(private pluginsContainer: PluginsContainer.Interface) {}

    toAST(model: CmsModel): CmsModelAst {
        const fieldTypePlugins = this.pluginsContainer.byType<CmsModelFieldToGraphQLPlugin>(
            "cms-model-field-to-graphql"
        );

        const converter = new CmsModelToAstConverter(
            new CmsModelFieldToAstConverterFromPlugins(fieldTypePlugins)
        );

        return converter.toAst(model);
    }
}

export const ModelToAstConverter = ConverterAbstraction.createImplementation({
    implementation: ModelToAstConverterImpl,
    dependencies: [PluginsContainer]
});
