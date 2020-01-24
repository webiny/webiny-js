import { Plugin, PluginsContainer } from "@webiny/api/types";

export type ApolloGatewayHeaders = Plugin & {
    buildHeaders(params: { headers: { [key: string]: string }; plugins: PluginsContainer }): void;
};
