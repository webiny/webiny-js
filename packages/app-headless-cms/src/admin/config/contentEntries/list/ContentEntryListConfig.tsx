import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Browser, BrowserConfig } from "./Browser";

const base = createConfigurableComponent<ContentEntryListConfig>("ContentEntryListConfig");

export const ContentEntryListConfig = Object.assign(base.Config, { Browser });
export const ContentEntryListWithConfig = base.WithConfig;

interface ContentEntryListConfig {
    browser: BrowserConfig;
}

export function useContentEntryListConfig() {
    const config = base.useConfig();

    const browser = config.browser || {};

    return useMemo(
        () => ({
            browser: { ...browser, filters: [...(browser.filters || [])] }
        }),
        [config]
    );
}
