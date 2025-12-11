import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { BrowserConfig } from "./configComponents/Browser/index.js";
import { Browser } from "./configComponents/Browser/index.js";
import type { FileDetailsConfig } from "./configComponents/FileDetails/index.js";
import { FileDetails } from "./configComponents/FileDetails/index.js";
import { getThumbnailRenderer } from "./getThumbnailRenderer.js";
import { CompositionScope } from "@webiny/react-composition";
import { useAcoConfig } from "@webiny/app-aco";

const base = createConfigurableComponent<FileManagerViewConfigData>("FileManagerView");

const ScopedFileManagerViewConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"fm"}>
            <base.Config>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedFileManagerViewConfig.displayName = "FileManagerViewConfig";

export const FileManagerViewConfig = Object.assign(base.Config, { Browser, FileDetails });
export const FileManagerViewWithConfig = base.WithConfig;

interface FileManagerViewConfigData {
    browser: BrowserConfig;
    fileDetails: FileDetailsConfig;
}

export function useFileManagerViewConfig() {
    const config = base.useConfig();
    const acoConfig = useAcoConfig(config);

    const browser = config.browser || {};

    const fileDetailsActions = [...(config.fileDetails?.actions || [])];
    const fileDetailsThumbnails = [...(config.fileDetails?.thumbnails || [])];

    const finalConfig = useMemo(
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
                filtersToWhere: [...(browser.filtersToWhere || [])],
                folder: acoConfig.folder,
                file: acoConfig.record
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

    return finalConfig;
}
