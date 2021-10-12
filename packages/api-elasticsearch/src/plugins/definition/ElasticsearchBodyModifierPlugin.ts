import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { SearchBody } from "elastic-ts";

export interface ModifyBodyParams {
    body: SearchBody;
}

interface Callable {
    (params: ModifyBodyParams): void;
}

export abstract class ElasticsearchBodyModifierPlugin extends Plugin {
    private readonly callable?: Callable;

    public constructor(callable?: Callable) {
        super();
        this.callable = callable;
    }

    public modifyBody(params: ModifyBodyParams): void {
        if (typeof this.callable !== "function") {
            throw new WebinyError(
                `Missing modification for the body.`,
                "BODY_MODIFICATION_MISSING",
                {
                    params
                }
            );
        }
        this.callable(params);
    }
}
