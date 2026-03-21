import { OpenSearchClient as OpenSearchClientAbstraction } from "~/abstractions/OpenSearchClient.js";
import type { Client } from "~/types.js";


export class OpenSearchClient implements OpenSearchClientAbstraction.Interface {
    private readonly client;

    public constructor(client: Client) {
        this.client = client;
    }

    public use(): Client {
        return this.client;
    }
}
