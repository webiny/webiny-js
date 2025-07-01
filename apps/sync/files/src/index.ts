/**
 * A handler which will either copy or delete files in S3.
 */
import { createFilesResolver } from "@webiny/api-sync-system";
import { createS3Client } from "@webiny/aws-sdk/client-s3/index.js";

const debug = process.env.DEBUG === "true";

export const handler = createFilesResolver({
    plugins: [],
    debug,
    createS3Client
});
