import { Plugin } from "@webiny/plugins/types";
import { SecurityIdentity } from "@webiny/app-security/types";

export interface GraphQLPlaygroundTabParams {
    locale: string;
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
