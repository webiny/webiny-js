import { OpenSearchContext as OpenSearchContextAbstraction } from "./abstraction.js";

export class OpenSearchContext implements OpenSearchContextAbstraction.Interface {
    private readonly client: OpenSearchContextAbstraction.Client;

    public constructor(client: OpenSearchContextAbstraction.Client) {
        this.client = client;
    }

    public get opensearch(): OpenSearchContextAbstraction.Client {
        return this.client;
    }

    public get elasticsearch(): OpenSearchContextAbstraction.Client {
        return this.client;
    }
}
