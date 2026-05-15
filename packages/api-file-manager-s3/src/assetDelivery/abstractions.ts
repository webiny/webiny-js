import { createAbstraction } from "@webiny/feature/api";
import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";

export interface IS3AssetDeliveryConfig {
    presignedUrlTtl: number;
    imageResizeWidths: number[];
    assetStreamingMaxSize: number;
}

export const S3AssetDeliveryConfig =
    createAbstraction<IS3AssetDeliveryConfig>("AssetDelivery/S3Config");

export const S3Client = createAbstraction<S3>("AssetDelivery/S3Client");

export const S3Bucket = createAbstraction<string>("AssetDelivery/S3Bucket");
