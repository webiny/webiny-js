import {
    createAssetDelivery as createBaseAssetDelivery,
    createAssetDeliveryConfig
} from "@webiny/api-file-manager";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { S3AssetResolver } from "~/assetDelivery/s3/S3AssetResolver.js";
import { S3OutputStrategy } from "~/assetDelivery/s3/S3OutputStrategy.js";
import { SharpTransform } from "~/assetDelivery/s3/SharpTransform.js";
import type { AssetDeliveryParams } from "~/assetDelivery/types.js";

export const assetDeliveryConfig = (params: AssetDeliveryParams) => {
    const bucket = process.env.S3_BUCKET as string;
    const region = process.env.AWS_REGION as string;

    const {
        // Presigned URLs last 1 hour
        presignedUrlTtl = 3600,
        imageResizeWidths = [100, 300, 500, 750, 1000, 1500, 2500],
        /**
         * Even though Lambda's response payload limit is 6,291,556 bytes, we leave some room for the response envelope.
         * We had situations where a 4.7MB file would cause the payload to go over the limit, so let's be on the safe side.
         */
        assetStreamingMaxSize = 4718592
    } = params;

    return [
        // Base asset delivery
        createBaseAssetDelivery(),
        // S3 plugins
        createAssetDeliveryConfig(config => {
            const s3 = new S3({ region });

            config.decorateAssetResolver(() => {
                // This resolver loads file information from the `.metadata` file.
                return new S3AssetResolver(s3, bucket);
            });

            config.decorateAssetOutputStrategy(() => {
                return new S3OutputStrategy(s3, bucket, presignedUrlTtl, assetStreamingMaxSize);
            });

            config.decorateAssetTransformationStrategy(() => {
                return new SharpTransform({ s3, bucket, imageResizeWidths });
            });
        })
    ];
};
