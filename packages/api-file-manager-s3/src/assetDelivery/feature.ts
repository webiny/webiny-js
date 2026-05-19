import { createFeature } from "@webiny/feature/api";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client, S3Bucket, S3AssetDeliveryConfig } from "./abstractions.js";
import type { AssetDeliveryParams } from "./types.js";
import { S3AssetResolverImpl } from "./s3/S3AssetResolver.js";
import { S3OutputStrategyImpl } from "./s3/S3OutputStrategy.js";
import { SharpTransformImpl } from "./s3/SharpTransform.js";

export const createS3AssetDeliveryFeature = (params: AssetDeliveryParams = {}) => {
    return createFeature({
        name: "AssetDelivery/S3",
        register(container) {
            container.registerInstance(
                S3Client,
                new S3({ region: process.env.AWS_REGION as string })
            );
            container.registerInstance(S3Bucket, process.env.S3_BUCKET as string);
            container.registerInstance(S3AssetDeliveryConfig, {
                presignedUrlTtl: params.presignedUrlTtl ?? 3600,
                imageResizeWidths: params.imageResizeWidths ?? [
                    128, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840
                ],
                assetStreamingMaxSize: params.assetStreamingMaxSize ?? 4718592
            });

            container.register(S3AssetResolverImpl);
            container.register(S3OutputStrategyImpl);
            container.register(SharpTransformImpl);
        }
    });
};
