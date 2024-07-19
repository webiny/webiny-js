import {
    WEBINY_EXPORT_ASSETS_EXTENSION,
    WEBINY_EXPORT_COMBINED_ENTRIES_EXTENSION,
    WEBINY_EXPORT_ENTRIES_EXTENSION
} from "~/tasks/constants";
import { CmsImportExportFileType } from "~/types";

export const getImportExportFileType = (input: string): CmsImportExportFileType | undefined => {
    const result = new URL(input);
    const url = result.pathname;
    if (url.endsWith(WEBINY_EXPORT_COMBINED_ENTRIES_EXTENSION)) {
        return CmsImportExportFileType.COMBINED_ENTRIES;
    } else if (url.endsWith(WEBINY_EXPORT_ENTRIES_EXTENSION)) {
        return CmsImportExportFileType.ENTRIES;
    } else if (url.endsWith(WEBINY_EXPORT_ASSETS_EXTENSION)) {
        return CmsImportExportFileType.ASSETS;
    }
    return undefined;
};
