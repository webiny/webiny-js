import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { SearchBody } from "elastic-ts";

export interface ModifyBodyParams {
    body: SearchBody;
}

export interface ModifyBodyCallable<T extends ModifyBodyParams> {
    (params: T): void;
}

export abstract class ElasticsearchBodyModifierPlugin<
    T extends ModifyBodyParams = ModifyBodyParams
> extends Plugin {
    private readonly callable?: ModifyBodyCallable<T>;

    public constructor(callable?: ModifyBodyCallable<T>) {
        super();
        this.callable = callable;
    }

    public modifyBody(params: T): void {
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
