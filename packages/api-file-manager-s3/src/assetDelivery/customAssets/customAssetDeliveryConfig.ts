import { createAssetDeliveryConfig } from "@webiny/api-file-manager";
import { S3 } from "@webiny/aws-sdk/client-s3";
import { S3CustomAssetResolver } from "./S3CustomAssetResolver";
import { CustomAssetProcessor } from "~/assetDelivery/customAssets/CustomAssetProcessor";

export const customAssetDeliveryConfig = () => {
    return createAssetDeliveryConfig(config => {
        config.decorateAssetResolver(({ assetResolver }) => {
            const s3 = new S3({ region: process.env.AWS_REGION });
            return new S3CustomAssetResolver(s3, String(process.env.S3_BUCKET), assetResolver);
        });

        config.decorateAssetProcessor(({ assetProcessor }) => {
            return new CustomAssetProcessor(assetProcessor);
        });
    });
};
