import "@fastify/cookie";
import type {
    FastifyRequest,
    FastifyReply,
    HTTPMethods as BaseHttpMethods,
    RouteHandlerMethod
} from "fastify";
export type { FastifyInstance } from "fastify";
import type { Context as BaseContext } from "@webiny/api/types.js";

export interface RouteMethodOptions {
    override?: boolean;
}

export type RouteMethodPath = `/${string}` | "*";
export interface RouteMethod {
    (path: RouteMethodPath, handler: RouteHandlerMethod, options?: RouteMethodOptions): void;
}

export type Request = FastifyRequest;
export type Reply = FastifyReply;

export type HTTPMethods = Uppercase<BaseHttpMethods>;

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

export interface Context extends BaseContext {
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
        __webiny_raw_result: any;
    }
}
