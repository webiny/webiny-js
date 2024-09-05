import { WEBINY_EXPORT_ASSETS_EXTENSION, WEBINY_EXPORT_ENTRIES_EXTENSION } from "~/tasks/constants";
import { CmsImportExportFileType } from "~/types";

interface SuccessResponse {
    type: CmsImportExportFileType;
    pathname: string;
    error?: never;
}

interface ErrorResponse {
    type: string | undefined;
    pathname: string;
    error: true;
}

export type Response = SuccessResponse | ErrorResponse;

export const getImportExportFileType = (input: string): Response => {
    const result = new URL(input);
    const pathname = result.pathname;
    if (pathname.endsWith(WEBINY_EXPORT_ENTRIES_EXTENSION)) {
        return {
            type: CmsImportExportFileType.ENTRIES,
            pathname
        };
    } else if (pathname.endsWith(WEBINY_EXPORT_ASSETS_EXTENSION)) {
        return {
            type: CmsImportExportFileType.ASSETS,
            pathname
        };
    }

    if (pathname.includes(".") === false) {
        return {
            type: undefined,
            pathname,
            error: true
        };
    }
    const extensions = pathname.split(".");
    extensions.shift();

    const type = extensions.join(".");

    return {
        type,
        pathname,
        error: true
    };
};
