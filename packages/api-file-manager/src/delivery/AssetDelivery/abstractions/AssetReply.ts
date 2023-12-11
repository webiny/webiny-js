import { RouteHandlerMethod } from "fastify";
import { Reply } from "@webiny/handler/types";

export interface AssetReply {
    reply(reply: Reply): Promise<RouteHandlerMethod>;
}
