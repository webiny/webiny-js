import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { ResponseHeaders } from "@webiny/handler";
import { HttpStreamBody } from "@webiny/api-kernel-core";
import { StreamAssetReply as StreamAssetReplyAbstraction } from "./abstractions.js";

class StreamAssetReplyImpl implements StreamAssetReplyAbstraction.Interface {
    create(asset: StreamAssetReplyAbstraction.Asset): StreamAssetReplyAbstraction.AssetReply {
        return new AssetReply({
            code: 200,
            headers: ResponseHeaders.create({
                "cache-control": `public, max-age=${86400 * 365}`,
                "content-type": asset.getContentType()
            }),
            /*
             * Streamed: the transport writes each chunk as storage hands it over, so a large file
             * never sits in memory whole. A transport that can't stream (API Gateway) collects it.
             */
            body: async () => {
                const source = await asset.getContentsStream();
                return new HttpStreamBody(source);
            }
        });
    }
}

export const StreamAssetReply = StreamAssetReplyAbstraction.createImplementation({
    implementation: StreamAssetReplyImpl,
    dependencies: []
});
