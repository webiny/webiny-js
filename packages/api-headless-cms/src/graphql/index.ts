import type { Plugin } from "@webiny/plugins/types.js";
import { createBaseSchema } from "~/graphql/schema/baseSchema.js";
import { createCmsSchema } from "~/graphql/schema/cms/index.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type CreateGraphQLParams = {};
export const createGraphQL = (_params: CreateGraphQLParams = {}): Plugin[] => {
    return [createBaseSchema(), createCmsSchema()];
};
