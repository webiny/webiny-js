import { ValidateImportFromUrl } from "~/tasks/domain/validateImportFromUrl/ValidateImportFromUrl";
import { ExternalFileFetcher } from "~/tasks/utils/externalFileFetcher";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { FileFetcher } from "~/tasks/utils/fileFetcher";

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
