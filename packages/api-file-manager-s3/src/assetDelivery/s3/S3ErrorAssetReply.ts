import { AssetReply } from "@webiny/api-file-manager";

export class S3ErrorAssetReply extends AssetReply {
    constructor(message: string) {
        super({
            code: 400,
            body: () => ({ error: message })
        });
    }
}
