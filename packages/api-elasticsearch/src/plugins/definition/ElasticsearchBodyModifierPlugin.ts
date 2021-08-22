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
    C extends ContextInterface = ContextInterface
> extends Plugin {
    private readonly callable?: Callable<C>;

    public constructor(callable?: Callable<C>) {
        super();
        this.callable = callable;
    }

    public modifyBody<T extends ContextInterface = ContextInterface>(
        params: ModifyBodyParams<T>
    ): void {
        this.exec(params);
    }

    private exec(params: any): void {
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
