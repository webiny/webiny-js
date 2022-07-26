import { FastifyInstance, FastifyRequest, HTTPMethods, RouteHandlerMethod } from "fastify";
import { ClientContext } from "@webiny/handler-client/types";

export type RouteTypes = HTTPMethods;

export interface RouteMethodOptions {
    override?: boolean;
}

export interface RouteMethod {
    (path: string, handler: RouteHandlerMethod, options?: RouteMethodOptions): void;
}

export interface FastifyContextRoutes {
    defined: Record<RouteTypes, string[]>;
    onGet: RouteMethod;
    onPost: RouteMethod;
    onPut: RouteMethod;
    onPatch: RouteMethod;
    onDelete: RouteMethod;
    onOptions: RouteMethod;
    onAll: RouteMethod;
    onHead: RouteMethod;
}

export interface FastifyContext extends ClientContext {
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
    routes: FastifyContextRoutes;
}

declare module "fastify" {
    interface FastifyInstance {
        webiny: FastifyContext;
    }
}
