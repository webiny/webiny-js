import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { ContextInterface } from "@webiny/handler/types";
import { SearchBody } from "elastic-ts";

export interface ModifyBodyParams<T extends ContextInterface> {
    context: T;
    body: SearchBody;
}

interface Callable<T extends ContextInterface> {
    (params: ModifyBodyParams<T>): void;
}

export abstract class ElasticsearchBodyModifierPlugin<
    T extends ContextInterface = ContextInterface
> extends Plugin {
    private readonly callable?: Callable<T>;

    public constructor(callable?: Callable<T>) {
        super();
        this.callable = callable;
    }

    public modifyBody(params: ModifyBodyParams<T>): void {
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
