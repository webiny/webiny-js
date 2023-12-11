import { S3 } from "@webiny/aws-sdk/client-s3";
import { ContextPlugin } from "@webiny/api";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export const addFileMetadata = () => {
    return new ContextPlugin<FileManagerContext>(context => {
        context.fileManager.onFileAfterCreate.subscribe(async ({ file }) => {
            const metadata = {
                id: file.id,
                tenant: file.tenant,
                locale: file.locale,
                size: file.size,
                contentType: file.type
            };

            const s3 = new S3({ region: process.env.AWS_REGION });

            await s3.putObject({
                Bucket: String(process.env.S3_BUCKET),
                Key: `${file.key}.metadata`,
                Body: JSON.stringify(metadata),
                ContentType: "application/json",
                CacheControl: "max-age=31536000"
            });
        });
    });
};
