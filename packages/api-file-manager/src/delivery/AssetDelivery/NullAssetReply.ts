import { Reply } from "@webiny/handler/types";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply";

export class NullAssetReply implements AssetReply {
    async reply(reply: Reply): Promise<Reply> {
        return reply.code(404).send({ error: "Asset output strategy is not implemented!" });
    }
}
