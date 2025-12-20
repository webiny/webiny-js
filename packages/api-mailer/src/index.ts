import type { PluginCollection } from "@webiny/plugins/types.js";
import { createMailerContext as createMailerContextPlugin } from "~/context.js";
import { createGraphQL } from "~/graphql/index.js";

export const createMailerContext = (): PluginCollection => {
    return [createMailerContextPlugin()];
};

export const createMailerGraphQL = () => {
    return [...createGraphQL()];
};
