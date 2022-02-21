import S3 from "aws-sdk/clients/s3";
import getPresignedPostPayload from "../utils/getPresignedPostPayload";
import uploadFileToS3 from "../utils/uploadFileToS3";
import {
    FilePhysicalStoragePlugin,
    FilePhysicalStoragePluginUploadParams
} from "@webiny/api-file-manager/plugins/definitions/FilePhysicalStoragePlugin";
import { PresignedPostPayloadData } from "~/types";

const S3_BUCKET = process.env.S3_BUCKET;

export interface S3FilePhysicalStoragePluginUploadParams
    extends FilePhysicalStoragePluginUploadParams,
        PresignedPostPayloadData {}

export default (): FilePhysicalStoragePlugin => {
    /**
     * We need to extends the type for FilePhysicalStoragePlugin.
     * Otherwise the getPresignedPostPayload does not know it has all required values in params.
     */
    return new FilePhysicalStoragePlugin<S3FilePhysicalStoragePluginUploadParams>({
        upload: async params => {
            const { settings, buffer, ...data } = params;

            const { data: preSignedPostPayload, file } = await getPresignedPostPayload(
                data,
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

            await s3
                .deleteObject({
                    Bucket: S3_BUCKET,
                    Key: key
                })
                .promise();
        }
    });
};
