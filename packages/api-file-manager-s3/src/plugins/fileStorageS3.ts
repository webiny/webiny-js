import S3 from "aws-sdk/clients/s3";
import getPresignedPostPayload from "../utils/getPresignedPostPayload";
import uploadFileToS3 from "../utils/uploadFileToS3";
import { FilePhysicalStoragePlugin } from "@webiny/api-file-manager/plugins/definitions/FilePhysicalStoragePlugin";

const S3_BUCKET = process.env.S3_BUCKET;

export default (): FilePhysicalStoragePlugin => {
    return new FilePhysicalStoragePlugin({
        upload: async args => {
            const { settings, buffer, ...data } = args;

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
        delete: async args => {
            const { key } = args;
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
