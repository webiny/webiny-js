import { Logger } from "webiny/api";
import { CmsGraphQLSchemaVariant } from "webiny/api/cms/graphql";
import { transformModelSchema } from "./transformModelSchema.js";

/**
 * Serves the Headless CMS GraphQL API in the v5 shape on `/cms/v5/{manage|read|preview}/{locale?}`,
 * for external systems built against v5. The default `/cms/*` endpoints are not affected.
 */
class CmsV5SchemaVariantImpl implements CmsGraphQLSchemaVariant.Interface {
    public readonly name = "v5";

    constructor(private logger: Logger.Interface) {}

    transformModelSchema(params: CmsGraphQLSchemaVariant.Params) {
        const { typeDefs, resolvers, conflicts } = transformModelSchema(params);
        if (conflicts.length > 0) {
            this.logger.warn(
                `Model "${params.model.modelId}" has fields which are not available in the v5 schema, because their names are taken by entry fields: ${conflicts.join(", ")}.`
            );
        }
        return { typeDefs, resolvers };
    }
}

export default CmsGraphQLSchemaVariant.createImplementation({
    implementation: CmsV5SchemaVariantImpl,
    dependencies: [Logger]
});
