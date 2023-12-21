import { Reply } from "@webiny/handler/types";
import { AssetReply } from "~/delivery";

export class NotAuthorizedReply implements AssetReply {
    async reply(reply: Reply): Promise<Reply> {
        return reply
            .code(403)
            .headers({
                "cache-control": "no-store",
                "content-type": "application/json"
            })
            .send({ error: "Not authorized!", code: "NOT_AUTHORIZED" });
    }
}
