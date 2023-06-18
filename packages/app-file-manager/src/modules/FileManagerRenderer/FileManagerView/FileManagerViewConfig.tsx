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
            browser: { ...browser, filters: [...(browser.filters || [])] },
            fileDetails: config.fileDetails || {
                width: "1000px"
            }
        }),
        [config]
    );
}
