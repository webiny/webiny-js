import { ValidateImportFromUrl } from "~/tasks/domain/validateImportFromUrl/ValidateImportFromUrl";
import { ExternalFileFetcher } from "~/tasks/utils/externalFileFetcher";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { getBucket } from "~/tasks/utils/helpers/getBucket";

export const createValidateImportFromUrl = () => {
    const fileFetcher = new ExternalFileFetcher({
        fetcher: fetch,
        getChecksumHeader: headers => (headers.get("etag") || "").replaceAll('"', "")
    });

    return new ValidateImportFromUrl({
        client: createS3Client(),
        bucket: getBucket(),
        fileFetcher
    });
};
