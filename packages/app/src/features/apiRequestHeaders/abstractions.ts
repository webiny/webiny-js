import { createAbstraction } from "@webiny/feature/admin";

type IHeaders = Record<string, string | number | undefined>;

/**
 * Extra headers for every request to Webiny's API (`GraphQLClient` and `ApiStreamClient`), read when
 * a request is sent. An extension registers one for a header the API needs on each request, e.g. a
 * scope its own decorators read. Headers the request sets itself (tenant, auth, …) win.
 *
 * Register it in the root container (as `RegisterFeature` does): the clients look providers up there.
 * Only for Webiny's API: requests to other hosts (storage uploads, identity providers) don't get them.
 */
export interface IApiRequestHeaders {
    getHeaders(): IHeaders | Promise<IHeaders>;
}

export const ApiRequestHeaders = createAbstraction<IApiRequestHeaders>("ApiRequestHeaders");

export namespace ApiRequestHeaders {
    export type Interface = IApiRequestHeaders;
    export type Headers = IHeaders;
}

/** The headers of every registered `ApiRequestHeaders`, collected for one request. */
export interface IApiRequestHeadersResolver {
    resolve(): Promise<IHeaders>;
}

export const ApiRequestHeadersResolver = createAbstraction<IApiRequestHeadersResolver>(
    "ApiRequestHeadersResolver"
);

export namespace ApiRequestHeadersResolver {
    export type Interface = IApiRequestHeadersResolver;
}
