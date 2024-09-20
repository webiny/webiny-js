import { getImportExportFileType } from "~/tasks/utils/helpers/getImportExportFileType";
import { CmsImportExportFileType } from "~/types";

describe("getImportExportFileType", () => {
    it("should properly detect entries file type", () => {
        const url =
            "https://wby-fm-bucket-ba055b8.s3.eu-central-1.amazonaws.com/cms-export/author/66991d2f367e7500082f95728lyrbu562/aCustomFileNameForTheFile.we.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=%%2Feu-eu-1%2Fs3%2Faws4_request&X-Amz-Date=&X-Amz-Expires=&X-Amz-Security-Token=&X-Amz-SignedHeaders=host&x-id=GetObject";

        const result = getImportExportFileType(url);
        const { pathname } = new URL(url);

        expect(result).toEqual({
            type: CmsImportExportFileType.ENTRIES,
            pathname
        });
    });

    it("should properly detect assets file type", () => {
        const url =
            "https://wby-fm-bucket-ba055b8.s3.eu-central-1.amazonaws.com/cms-export/author/66991d2f367e7500082f95728lyrbu562/aCustomFileName..wa.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=%%2Feu-eu-1%2Fs3%2Faws4_request&X-Amz-Date=&X-Amz-Expires=&X-Amz-Security-Token=&X-Amz-SignedHeaders=host&x-id=GetObject";

        const result = getImportExportFileType(url);
        const { pathname } = new URL(url);

        expect(result).toEqual({
            type: CmsImportExportFileType.ASSETS,
            pathname
        });
    });

    it("should fail to detect a file type", () => {
        const url =
            "https://wby-fm-bucket-ba055b8.s3.eu-central-1.amazonaws.com/cms-export/author/66991d2f367e7500082f95728lyrbu562/aCustomFileNameForTheFile.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=%%2Feu-eu-1%2Fs3%2Faws4_request&X-Amz-Date=&X-Amz-Expires=&X-Amz-Security-Token=&X-Amz-SignedHeaders=host&x-id=GetObject";

        const result = getImportExportFileType(url);
        const { pathname } = new URL(url);

        expect(result).toEqual({
            type: "zip",
            pathname,
            error: true
        });
    });
});
