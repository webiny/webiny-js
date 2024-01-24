import "@fastify/cookie";
import { FastifyRequest, FastifyReply, HTTPMethods, RouteHandlerMethod } from "fastify";
export { FastifyInstance, HTTPMethods } from "fastify";
import { ClientContext } from "@webiny/handler-client/types";

export interface RouteMethodOptions {
    override?: boolean;
}

export type RouteMethodPath = `/${string}` | "*";
export interface RouteMethod {
    (path: RouteMethodPath, handler: RouteHandlerMethod, options?: RouteMethodOptions): void;
}

export type Request = FastifyRequest;
export type Reply = FastifyReply;

export type DefinedContextRoutes = Record<HTTPMethods, string[]>;
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
     * Current request. Must be set only once!
     */
    request: FastifyRequest;
    /**
     * Current reply. Must be set only once!
     */
    reply: FastifyReply;
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
