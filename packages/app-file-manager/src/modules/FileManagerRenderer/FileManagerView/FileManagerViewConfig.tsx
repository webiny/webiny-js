import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Browser, BrowserConfig } from "./configComponents/Browser";
import { FileDetails, FileDetailsConfig } from "./configComponents/FileDetails";
import { getThumbnailRenderer } from "./getThumbnailRenderer";

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

    const fileDetailsActions = [...(config.fileDetails?.actions || [])];
    const fileDetailsThumbnails = [...(config.fileDetails?.thumbnails || [])];

    return useMemo(
        () => ({
            getThumbnailRenderer,
            browser: {
                ...browser,
                grid: {
                    itemActions: [...(browser.grid?.itemActions || [])],
                    itemThumbnails: [...(browser.grid?.itemThumbnails || [])]
                },
                bulkActions: [...(browser.bulkActions || [])],
                bulkEditFields: [...(browser.bulkEditFields || [])],
                filterByTags: browser.filterByTags ?? false,
                filters: [...(browser.filters || [])],
                filtersToWhere: [...(browser.filtersToWhere || [])]
            },
            fileDetails: {
                actions: fileDetailsActions,
                thumbnails: fileDetailsThumbnails,
                groupFields: config.fileDetails?.groupFields ?? false,
                width: config.fileDetails?.width ?? "1000px",
                fields: config.fileDetails?.fields ?? []
            }
        }),
        [config]
    );
}
