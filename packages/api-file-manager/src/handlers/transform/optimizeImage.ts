/**
 * Sharp is included in the AWS Lambda layer
 */
// @ts-ignore
import sharp from "sharp";
import { PutObjectCommandInput } from "@webiny/aws-sdk/client-s3";

export default async (
    buffer: PutObjectCommandInput["Body"],
    type: string
): Promise<PutObjectCommandInput["Body"]> => {
    switch (type) {
        case "image/png": {
            return await sharp(buffer)
                .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
                .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
                .withMetadata()
                .toBuffer();
        }
        case "image/jpeg":
        case "image/jpg": {
            return await sharp(buffer)
                .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
                .toFormat("jpeg", { quality: 90 })
                .toBuffer();
        }
        default:
            return buffer;
    }
};
