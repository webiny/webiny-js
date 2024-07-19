import { getImportExportFileType } from "~/tasks/utils/helpers/getImportExportFileType";
import { CmsImportExportFileType } from "~/types";

describe("getImportExportFileType", () => {
    it("should properly detect combined entries file type", () => {
        const url =
            "https://wby-fm-bucket-ba055b8.s3.eu-central-1.amazonaws.com/cms-export/author/66991d2f367e7500082f95728lyrbu562/aNameOfTheFile.we.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=%%2Feu-eu-1%2Fs3%2Faws4_request&X-Amz-Date=&X-Amz-Expires=&X-Amz-Security-Token=&X-Amz-SignedHeaders=host&x-id=GetObject";

        const type = getImportExportFileType(url);

        expect(type).toEqual(CmsImportExportFileType.COMBINED_ENTRIES);
    });

    it("should properly detect entries file type", () => {
        const url =
            "https://wby-fm-bucket-ba055b8.s3.eu-central-1.amazonaws.com/cms-export/author/66991d2f367e7500082f95728lyrbu562/aCustomFileNameForTheFile.wee.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=%%2Feu-eu-1%2Fs3%2Faws4_request&X-Amz-Date=&X-Amz-Expires=&X-Amz-Security-Token=&X-Amz-SignedHeaders=host&x-id=GetObject";

        const type = getImportExportFileType(url);

        expect(type).toEqual(CmsImportExportFileType.ENTRIES);
    });

    it("should properly detect assets file type", () => {
        const url =
            "https://wby-fm-bucket-ba055b8.s3.eu-central-1.amazonaws.com/cms-export/author/66991d2f367e7500082f95728lyrbu562/aCustomFileName.wea.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=%%2Feu-eu-1%2Fs3%2Faws4_request&X-Amz-Date=&X-Amz-Expires=&X-Amz-Security-Token=&X-Amz-SignedHeaders=host&x-id=GetObject";

        const type = getImportExportFileType(url);

        expect(type).toEqual(CmsImportExportFileType.ASSETS);
    });

    it("should fail to detect a file type", () => {
        const url =
            "https://wby-fm-bucket-ba055b8.s3.eu-central-1.amazonaws.com/cms-export/author/66991d2f367e7500082f95728lyrbu562/aCustomFileNameForTheFile.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=%%2Feu-eu-1%2Fs3%2Faws4_request&X-Amz-Date=&X-Amz-Expires=&X-Amz-Security-Token=&X-Amz-SignedHeaders=host&x-id=GetObject";

        const type = getImportExportFileType(url);

        expect(type).toBeUndefined();
    });
});
