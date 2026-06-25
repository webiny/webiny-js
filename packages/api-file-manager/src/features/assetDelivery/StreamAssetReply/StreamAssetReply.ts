import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { ResponseHeaders } from "@webiny/handler";
import { StreamAssetReply as StreamAssetReplyAbstraction } from "./abstractions.js";

class StreamAssetReplyImpl implements StreamAssetReplyAbstraction.Interface {
    create(asset: StreamAssetReplyAbstraction.Asset): StreamAssetReplyAbstraction.AssetReply {
        return AssetReply.create({
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
