import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { Plugin } from "@webiny/plugins/types.js";

export interface GraphQLPlaygroundTabParams {
    identity: Identity;
}
export interface GraphQLPlaygroundTab {
    name: string;
    endpoint: string;
    headers: Record<string, string>;
    query: string;
}

export type GraphQLPlaygroundTabPlugin = Plugin<{
    type: "graphql-playground-tab";
    tab: (params: GraphQLPlaygroundTabParams) => GraphQLPlaygroundTab | null;
}>;
