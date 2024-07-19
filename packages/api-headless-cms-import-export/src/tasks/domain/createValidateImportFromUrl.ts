import { ValidateImportFromUrl } from "~/tasks/domain/validateImportFromUrl/ValidateImportFromUrl";
import { ExternalFileFetcher } from "~/tasks/utils/externalFileHeadFetcher";

export const createValidateImportFromUrl = () => {
    const fileFetcher = new ExternalFileFetcher({
        fetch
    });

    return new ValidateImportFromUrl({
        fileFetcher
    });
};
