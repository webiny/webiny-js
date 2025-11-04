import type { Plugin } from "@webiny/plugins/types.js";
import type { SecurityIdentity } from "@webiny/app-security/types.js";

export interface GraphQLPlaygroundTabParams {
    identity: SecurityIdentity;
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
