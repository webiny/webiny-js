import type { Client } from "~/client.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IOpenSearchClient {
    use(): Client;
}

export const OpenSearchClient = createAbstraction<IOpenSearchClient>("OpenSearch/Client");

export namespace OpenSearchClient {
    export type Interface = IOpenSearchClient;
    export type Return = Client;
}
