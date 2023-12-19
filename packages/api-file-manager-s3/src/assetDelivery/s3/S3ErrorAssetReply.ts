import { Reply } from "@webiny/handler/types";
import { AssetReply } from "@webiny/api-file-manager";

export class S3ErrorAssetReply implements AssetReply {
    private readonly message: string;

    constructor(message: string) {
        this.message = message;
    }

    async reply(reply: Reply): Promise<Reply> {
        return reply.code(400).send({ error: this.message });
    }
}
