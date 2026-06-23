import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { ResponseHeaders } from "@webiny/handler";
import {
    StreamAssetReply as StreamAssetReplyAbstraction,
    type IStreamAssetReply
} from "./abstractions.js";

class StreamAssetReplyImpl implements IStreamAssetReply {
    create(asset: Asset): AssetReply {
        return new AssetReply({
            code: 200,
            headers: ResponseHeaders.create({
                "cache-control": `public, max-age=${86400 * 365}`,
                "content-type": asset.getContentType()
            }),
            body: () => asset.getContents()
        });
    }
}

export const StreamAssetReply = StreamAssetReplyAbstraction.createImplementation({
    implementation: StreamAssetReplyImpl,
    dependencies: []
});
