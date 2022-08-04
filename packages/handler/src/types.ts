import {
    FastifyInstance,
    FastifyRequest,
    FastifyReply,
    HTTPMethods,
    RouteHandlerMethod
} from "fastify";
import { ClientContext } from "@webiny/handler-client/types";

export type RouteTypes = HTTPMethods;

export interface RouteMethodOptions {
    override?: boolean;
}

export interface RouteMethod {
    (path: string, handler: RouteHandlerMethod, options?: RouteMethodOptions): void;
}

export type Request = FastifyRequest;
export type Reply = FastifyReply;

export type DefinedContextRoutes = Record<RouteTypes, string[]>;
export interface ContextRoutes {
    defined: DefinedContextRoutes;
    onGet: RouteMethod;
    onPost: RouteMethod;
    onPut: RouteMethod;
    onPatch: RouteMethod;
    onDelete: RouteMethod;
    onOptions: RouteMethod;
    onAll: RouteMethod;
    onHead: RouteMethod;
}

export interface Context extends ClientContext {
    /**
     * An instance of fastify server.
     * Use at your own risk.
     * @instance
     */
    server: FastifyInstance;
    /**
     * Current request. Must be set only once!
     */
    request: FastifyRequest;
    /**
     * @internal
     */
    routes: ContextRoutes;
}

declare module "fastify" {
    interface FastifyInstance {
        webiny: Context;
    }
}
