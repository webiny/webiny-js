import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";

export type ReactRouterOnLinkPlugin = Plugin & {
    type: "react-router-on-link";
    onLink(params: { link: string; apolloClient: ApolloClient<any> }): void;
};
