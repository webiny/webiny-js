import { Context as BaseContext, ContextParams as BaseContextParams } from "@webiny/handler";
import { FastifyContext } from "~/types";

export interface ContextParams extends BaseContextParams {
    server: FastifyContext["server"];
    routes: FastifyContext["routes"];
}

export class Context extends BaseContext implements FastifyContext {
    public readonly server: FastifyContext["server"];
    public readonly routes: FastifyContext["routes"];
    // @ts-ignore
    public handlerClient: FastifyContext["handlerClient"];

    // @ts-ignore
    public request: FastifyContext["request"];

    public constructor(params: ContextParams) {
        super(params);
        this.server = params.server;
        this.routes = params.routes;
    }
}
