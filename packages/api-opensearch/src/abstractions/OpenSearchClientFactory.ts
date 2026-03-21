import { createAbstraction } from "@webiny/feature/api";
import type { Client } from "~/client.js";

export interface IOpenSearchClientFactory {
    getClient(): Client;
}

export const OpenSearchClientFactory =
    createAbstraction<IOpenSearchClientFactory>("OpenSearchClientFactory");

export namespace OpenSearchClientFactory {
    export type Interface = IOpenSearchClientFactory;
}
