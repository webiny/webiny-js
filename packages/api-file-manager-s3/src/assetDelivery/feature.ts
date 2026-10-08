import { createFeature } from "@webiny/feature/api";
import { createS3 } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client, S3Bucket, S3AssetDeliveryConfig } from "./abstractions.js";
import type { AssetDeliveryParams } from "./types.js";
import { S3AssetResolverImpl } from "./s3/S3AssetResolver.js";
import { S3OutputStrategyImpl } from "./s3/S3OutputStrategy.js";
import { LazySharpTransformImpl } from "./s3/LazySharpTransform.js";

export const createS3AssetDeliveryFeature = (params: AssetDeliveryParams = {}) => {
    return createFeature({
        name: "AssetDelivery/S3",
        register(container) {
            // register() runs for every request, so build the client only when something resolves
            // it, and reuse it across requests. Building it here cost every request an S3 client.
            container.registerFactory(S3Client, () => createS3());
            container.registerInstance(S3Bucket, process.env.S3_BUCKET as string);
            container.registerInstance(S3AssetDeliveryConfig, {
                presignedUrlTtl: params.presignedUrlTtl ?? 3600,
                imageResizeWidths: params.imageResizeWidths ?? [
                    128, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840
                ],
                imageQuality: params.imageQuality ?? {},
                assetStreamingMaxSize: params.assetStreamingMaxSize ?? 4718592
            });

            container.register(S3AssetResolverImpl);
            container.register(S3OutputStrategyImpl);

            if (process.env.WEBINY_FUNCTION_TYPE === "asset-delivery") {
                // Registered eagerly; `sharp` is still loaded lazily, inside the handler.
                container.register(LazySharpTransformImpl).inSingletonScope();
            }
        }
    });
};
