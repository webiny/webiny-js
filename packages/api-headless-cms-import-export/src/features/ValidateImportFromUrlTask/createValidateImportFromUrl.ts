import { ValidateImportFromUrl } from "./ValidateImportFromUrl.js";
import { ExternalFileFetcher } from "./ExternalFileFetcher/ExternalFileFetcher.js";
import { createS3Client } from "~/tasks/utils/helpers/s3Client.js";
import { getBucket } from "~/tasks/utils/helpers/getBucket.js";
import { FileFetcher } from "~/tasks/utils/fileFetcher/index.js";

export const createValidateImportFromUrl = () => {
    const fileFetcher = new ExternalFileFetcher({
        fetcher: fetch,
        getChecksumHeader: headers => (headers.get("etag") || "").replaceAll('"', "")
    });

    const internalFileFetcher = new FileFetcher({
        client: createS3Client(),
        bucket: getBucket()
    });

    return new ValidateImportFromUrl({
        fileFetcher,
        fileExists: async key => {
            return internalFileFetcher.exists(key);
        }
    });
};
