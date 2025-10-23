import { ContextPlugin } from "@webiny/api";
import { createGraphQLSchema } from "~/graphql/createGraphQLSchema.js";
import { SystemFeature } from "~/features/SystemFeature.js";

export const createSystemGraphQL = () => createGraphQLSchema();

export const createSystemContext = () => {
    return new ContextPlugin(context => {
        SystemFeature.register(context.container);
    });
};
