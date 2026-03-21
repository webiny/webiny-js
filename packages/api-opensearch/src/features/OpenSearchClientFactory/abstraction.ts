import { createAbstraction } from "@webiny/feature/api";
import type { Client, OpenSearchClientOptions } from "~/client.js";

export interface IOpenSearchClientFactory {
    getClient(params: OpenSearchClientOptions): Client;
}

export const OpenSearchClientFactory = createAbstraction<IOpenSearchClientFactory>(
    "OpenSearch/ClientFactory"
);

export namespace OpenSearchClientFactory {
    export type Interface = IOpenSearchClientFactory;
    export type Params = OpenSearchClientOptions;
    export type Return = Client;
}
