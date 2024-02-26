import { S3 } from "@webiny/aws-sdk/client-s3";
import { FilePhysicalStoragePlugin } from "@webiny/api-file-manager/plugins/FilePhysicalStoragePlugin";
import { getPresignedPostPayload } from "~/utils/getPresignedPostPayload";
import uploadFileToS3 from "../utils/uploadFileToS3";
import { ContextPlugin } from "@webiny/api";
import { createFileNormalizerFromContext } from "~/utils/createFileNormalizerFromContext";
import { PresignedPostPayloadData } from "~/types";

const S3_BUCKET = process.env.S3_BUCKET;

export default () => {
    /**
     * We need to extend the type for FilePhysicalStoragePlugin.
     * Otherwise, the `getPresignedPostPayload` doesn't know it has all required values in params.
     */
    return new ContextPlugin(context => {
        context.plugins.register(
            new FilePhysicalStoragePlugin({
                upload: async params => {
                    const { settings, buffer, ...data } = params;

                    const normalizer = createFileNormalizerFromContext(context);

                    const { data: preSignedPostPayload, file } = await getPresignedPostPayload(
                        await normalizer.normalizeFile(data as PresignedPostPayloadData),
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

                    await s3.deleteObject({
                        Bucket: S3_BUCKET,
                        Key: key
                    });
                }
            })
        );
    });
};
