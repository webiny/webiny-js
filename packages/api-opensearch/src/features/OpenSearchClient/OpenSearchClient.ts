import { OpenSearchClient as OpenSearchClientAbstraction } from "./abstraction.js";
import type { Client } from "~/types.js";

export class OpenSearchClientImpl implements OpenSearchClientAbstraction.Interface {
    private readonly client;

    public constructor(client: Client) {
        this.client = client;
    }

    public use(): Client {
        return this.client;
    }
}
