import { Context as BaseContext, ContextParams as BaseContextParams } from "@webiny/api";
import { Context as BaseContextType } from "~/types";

export interface ContextParams extends BaseContextParams {
    server: BaseContextType["server"];
    routes: BaseContextType["routes"];
}

export class Context extends BaseContext implements BaseContextType {
    public readonly server: BaseContextType["server"];
    public readonly routes: BaseContextType["routes"];
    // @ts-ignore
    public handlerClient: BaseContextType["handlerClient"];
    // @ts-ignore
    public request: BaseContextType["request"];
    // @ts-ignore
    public reply: BaseContextType["reply"];

    public constructor(params: ContextParams) {
        super(params);
        this.server = params.server;
        this.routes = params.routes;
    }
}
