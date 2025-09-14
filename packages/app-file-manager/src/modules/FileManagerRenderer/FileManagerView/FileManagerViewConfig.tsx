import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { BrowserConfig } from "./configComponents/Browser";
import { Browser } from "./configComponents/Browser";
import type { FileDetailsConfig } from "./configComponents/FileDetails";
import { FileDetails } from "./configComponents/FileDetails";
import { getThumbnailRenderer } from "./getThumbnailRenderer";
import { CompositionScope } from "@webiny/react-composition";

const base = createConfigurableComponent<FileManagerViewConfigData>("FileManagerView");

const ScopedFileManagerViewConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"fm"}>
            <base.Config>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedFileManagerViewConfig.displayName = "FileManagerViewConfig";

export const FileManagerViewConfig = Object.assign(ScopedFileManagerViewConfig, {
    Browser,
    FileDetails
});

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
                table: {
                    ...browser.table,
                    cellThumbnails: [...(browser.table?.cellThumbnails || [])]
                },
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
