import { createAbstraction } from "@webiny/feature/api";
import type { Client as IClient } from "~/client.js";

export interface IOpenSearchClient {
    use(): IClient;
}

export const OpenSearchClient = createAbstraction<IOpenSearchClient>("OpenSearch/Client");

export namespace OpenSearchClient {
    export type Interface = IOpenSearchClient;
    export type Client = IClient;
}
