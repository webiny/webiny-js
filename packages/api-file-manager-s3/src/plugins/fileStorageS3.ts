import S3 from "aws-sdk/clients/s3";
import { getPresignedPostPayload } from "~/utils/getPresignedPostPayload";
import uploadFileToS3 from "../utils/uploadFileToS3";
import { FilePhysicalStoragePlugin } from "@webiny/api-file-manager/plugins/FilePhysicalStoragePlugin";
import { PresignedPostPayloadData } from "~/types";

const S3_BUCKET = process.env.S3_BUCKET;

export default (): FilePhysicalStoragePlugin => {
    /**
     * We need to extends the type for FilePhysicalStoragePlugin.
     * Otherwise, the `getPresignedPostPayload` doesn't know it has all required values in params.
     */
    return new FilePhysicalStoragePlugin({
        upload: async params => {
            const { settings, buffer, ...data } = params;

            const { data: preSignedPostPayload, file } = await getPresignedPostPayload(
                data as PresignedPostPayloadData,
                settings
            );

            const response = await uploadFileToS3(buffer, preSignedPostPayload);
            if (!response.ok) {
                throw Error("Unable to upload file.");
            }

            return {
                data: preSignedPostPayload,
                file
            };
        },
        delete: async params => {
            const { key } = params;
            const s3 = new S3();

            if (!key || !S3_BUCKET) {
                return;
            }

            await s3
                .deleteObject({
                    Bucket: S3_BUCKET,
                    Key: key
                })
                .promise();
        }
    });
};
