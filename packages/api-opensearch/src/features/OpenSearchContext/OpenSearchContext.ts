import { OpenSearchContext as OpenSearchContextAbstraction } from "./abstraction.js";
import { OpenSearchContext as OpenSearchContextType } from "~/types.js";

export class OpenSearchContext implements OpenSearchContextAbstraction.Interface {
    private readonly context;

    public constructor(context: OpenSearchContextType) {
        this.context = context;
    }

    public get opensearch(): OpenSearchContextAbstraction.Client {
        return this.context.opensearch;
    }

    public get elasticsearch(): OpenSearchContextAbstraction.Client {
        return this.context.opensearch;
    }
}
