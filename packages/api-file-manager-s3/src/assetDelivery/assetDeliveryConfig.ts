import {
    createAssetDelivery as createBaseAssetDelivery,
    createAssetDeliveryConfig
} from "@webiny/api-file-manager";
import { S3 } from "@webiny/aws-sdk/client-s3";
import { S3AssetResolver } from "~/assetDelivery/s3/S3AssetResolver";
import { S3OutputStrategy } from "~/assetDelivery/s3/S3OutputStrategy";
import { SharpTransform } from "~/assetDelivery/s3/SharpTransform";

export type AssetDeliveryParams = Parameters<typeof createBaseAssetDelivery>[0] & {
    imageResizeWidths?: number[];
    presignedUrlTtl?: number;
};

export const assetDeliveryConfig = (params: AssetDeliveryParams) => {
    const bucket = process.env.S3_BUCKET as string;
    const region = process.env.AWS_REGION as string;

    const {
        // Presigned URLs last 7 days (maximum length allowed by AWS).
        presignedUrlTtl = 604800,
        imageResizeWidths = [100, 300, 500, 750, 1000, 1500, 2500],
        ...baseParams
    } = params;

    return [
        // Base asset delivery
        createBaseAssetDelivery(baseParams),
        // S3 plugins
        createAssetDeliveryConfig(config => {
            const s3 = new S3({ region });

            config.decorateAssetResolver(() => {
                // This resolver loads file information from the `.metadata` file.
                return new S3AssetResolver(s3, bucket);
            });

            config.decorateAssetOutputStrategy(() => {
                return new S3OutputStrategy(s3, bucket, presignedUrlTtl);
            });

            config.decorateAssetTransformationStrategy(() => {
                return new SharpTransform({ s3, bucket, imageResizeWidths });
            });
        })
    ];
};
