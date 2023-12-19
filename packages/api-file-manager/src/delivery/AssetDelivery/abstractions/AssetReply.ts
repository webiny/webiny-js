import { Reply } from "@webiny/handler/types";

export interface AssetReply {
    reply(reply: Reply): Promise<Reply>;
}
