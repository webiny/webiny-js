import { ValidateImportFromUrl } from "~/tasks/domain/validateImportFromUrl/ValidateImportFromUrl";
import { ExternalFileFetcher } from "~/tasks/utils/externalFileFetcher";

export const createValidateImportFromUrl = () => {
    const fileFetcher = new ExternalFileFetcher({
        fetcher: fetch
    });

    return new ValidateImportFromUrl({
        fileFetcher
    });
};
