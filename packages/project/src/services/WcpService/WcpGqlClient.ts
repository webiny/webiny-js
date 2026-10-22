import { getWcpGqlApiUrl } from "@webiny/wcp";

export class WcpGqlClient {
    static async execute<TData extends Record<string, any> = Record<string, any>>(
        query: string,
        variables: Record<string, any> = {},
        headers: HeadersInit = {}
    ) {
        // Loaded here rather than at the top of the file: `graphql-request` pulls in all of
        // `graphql`, about 140 modules, and every CLI command would load it just to register this
        // service. Most commands never send a GraphQL request to WCP, since the environment lookup
        // uses the REST endpoint first.
        const { request } = await import("graphql-request");

        const wcpApiUrl = getWcpGqlApiUrl();
        return request(wcpApiUrl, query, variables, headers) as Promise<TData>;
    }
}
