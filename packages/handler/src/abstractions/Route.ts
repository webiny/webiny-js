import { createAbstraction } from "@webiny/feature/api";
import type { FastifyRequest, FastifyReply } from "fastify";

export interface IRouteRequest {
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
    method: string;
    url: string;
    params: unknown;
    query: unknown;
}

export interface IRouteReply {
    code(statusCode: number): this;
    send(data?: unknown): void;
    header(key: string, value: unknown): this;
}

export interface IRoute {
    // TODO: add zodSrcPath abstraction validation support for this abstraction.
    execute(request: IRouteRequest, reply: IRouteReply): Promise<void>;
}

export const Route = createAbstraction<IRoute>("Route");

export namespace Route {
    export type Interface = IRoute;
    export type Request = IRouteRequest;
    export type Reply = IRouteReply;
}

export function toRouteRequest(req: FastifyRequest): IRouteRequest {
    return {
        body: req.body,
        headers: req.headers as Record<string, string | string[] | undefined>,
        method: req.method,
        url: req.url,
        params: (req.params as Record<string, string>) ?? {},
        query: (req.query as Record<string, string | string[]>) ?? {}
    };
}

export function toRouteReply(reply: FastifyReply): IRouteReply {
    return {
        code(statusCode) {
            reply.code(statusCode);
            return this;
        },
        send(data) {
            reply.send(data);
        },
        header(key, value) {
            reply.header(key, value as string);
            return this;
        }
    };
}
