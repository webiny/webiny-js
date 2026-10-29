import { createAbstraction } from "@webiny/feature/api";
import type { ApiEndpoint, CmsModel } from "~/types/index.js";

export interface ICmsGraphQLSchemaVariantModelSchema {
    typeDefs: string;
    resolvers: Record<string, any>;
}

export interface ICmsGraphQLSchemaVariantParams extends ICmsGraphQLSchemaVariantModelSchema {
    model: CmsModel;
    endpoint: ApiEndpoint;
}

/**
 * A variant of the CMS GraphQL schema, served next to the default one on
 * `/cms/{name}/{manage|read|preview}/{locale?}`. It receives the generated schema of each model
 * and returns the shape that variant serves, for example the v5 shape for clients built against v5.
 *
 * Nothing is served on those paths unless a variant with a matching name is registered.
 */
export interface ICmsGraphQLSchemaVariant {
    /**
     * The URL segment of the variant. Must match `v<number>`, for example `v5`.
     */
    name: string;
    transformModelSchema(
        params: ICmsGraphQLSchemaVariantParams
    ): ICmsGraphQLSchemaVariantModelSchema;
}

export const CmsGraphQLSchemaVariant = createAbstraction<ICmsGraphQLSchemaVariant>(
    "Cms/GraphQL/Schema/Variant"
);

export namespace CmsGraphQLSchemaVariant {
    export type Interface = ICmsGraphQLSchemaVariant;
    export type Params = ICmsGraphQLSchemaVariantParams;
    export type ModelSchema = ICmsGraphQLSchemaVariantModelSchema;
}
