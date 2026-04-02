import { createAbstraction } from "@webiny/feature/api";
import type { FastifyRequest, FastifyReply } from "fastify";

export interface IRoute {
    // TODO: add zodSrcPath abstraction validation support for this abstraction.
    execute(req: FastifyRequest, res: FastifyReply): Promise<void>;
}

export const Route = createAbstraction<IRoute>("Route");

export namespace Route {
    export type Interface = IRoute;
}
