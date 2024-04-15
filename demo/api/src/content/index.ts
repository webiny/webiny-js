import { createArticlesSchema } from "./articlesSchema";
import { createBaseSchema } from "./baseSchema";
import { createContentRegionsSchema } from "./contentRegionsSchema";

export const createGraphQLSchemaPlugin = () => {
    return [createBaseSchema(), createArticlesSchema(), createContentRegionsSchema()];
};
