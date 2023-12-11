import { RouteHandlerMethod } from "fastify";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply";
import { Reply } from "@webiny/handler/types";

export class NullAssetReply implements AssetReply {
    async reply(reply: Reply): Promise<RouteHandlerMethod> {
        return reply.code(404).send({ error: "Asset output is not implemented!" });
    }
}
