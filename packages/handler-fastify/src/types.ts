import { FastifyInstance } from "fastify/types/instance";
import { RouteHandlerMethod } from "fastify/types/route";
import { HttpContext } from "@webiny/handler-http/types";

export type RouteTypes = "post" | "get" | "options" | "delete" | "patch" | "put";

export interface RouteMethodOptions {
    override?: boolean;
}

export interface RouteMethod {
    (path: string, handler: RouteHandlerMethod, options?: RouteMethodOptions): void;
}

export interface FastifyContext extends HttpContext {
    /**
     * An instance of fastify server.
     * Use at your own risk.
     * @instance
     */
    server: FastifyInstance;
    /**
     * @internal
     */
    routes: {
        defined: Record<RouteTypes, string[]>;
        onGet: RouteMethod;
        onPost: RouteMethod;
        onPut: RouteMethod;
        onPatch: RouteMethod;
        onDelete: RouteMethod;
        onOptions: RouteMethod;
    };
}
