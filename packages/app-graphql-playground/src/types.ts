import { Plugin } from "@webiny/plugins/types";
import { SecurityIdentity } from "@webiny/app-security/types";

export type GraphQLPlaygroundTab = {
    name: string;
    endpoint: string;
    headers: Record<string, string>;
    query: string;
};

export type GraphQLPlaygroundTabPlugin = Plugin<{
    type: "graphql-playground-tab";
    tab(params: { locale: string; identity: SecurityIdentity }): GraphQLPlaygroundTab;
}>;
