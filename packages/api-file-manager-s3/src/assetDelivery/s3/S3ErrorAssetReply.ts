import { AssetReply } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";

export class S3ErrorAssetReply extends AssetReply {
    public static fromMessage(message: string) {
        return new S3ErrorAssetReply(message);
    }

    private constructor(message: string) {
        super({
            code: 400,
            body: () => ({ error: message })
        });
    }
}
