import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Browser, BrowserConfig } from "./configComponents/Browser";
import { FileDetails, FileDetailsConfig } from "./configComponents/FileDetails";

const base = createConfigurableComponent<FileManagerViewConfigData>("FileManagerView");

export const FileManagerViewConfig = Object.assign(base.Config, { Browser, FileDetails });
export const FileManagerViewWithConfig = base.WithConfig;

interface FileManagerViewConfigData {
    browser: BrowserConfig;
    fileDetails: FileDetailsConfig;
}

export function useFileManagerViewConfig() {
    const config = base.useConfig();

    const browser = config.browser || {};

    return useMemo(
        () => ({
            browser: {
                ...browser,
                bulkActions: [...(browser.bulkActions || [])],
                bulkEditFields: [...(browser.bulkEditFields || [])],
                filterByTags: browser.filterByTags ?? false,
                filters: [...(browser.filters || [])],
                filtersToWhere: [...(browser.filtersToWhere || [])]
            },
            fileDetails: {
                groupFields: config.fileDetails?.groupFields ?? false,
                width: config.fileDetails?.width ?? "1000px",
                fields: config.fileDetails?.fields ?? []
            }
        }),
        [config]
    );
}
