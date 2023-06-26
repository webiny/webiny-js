import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Browser, BrowserConfig } from "./config/Browser";

const base = createConfigurableComponent<ContentEntriesViewConfig>("ContentEntriesView");

export const ContentEntriesViewConfig = Object.assign(base.Config, { Browser });

export const ContentEntriesViewWithConfig = base.WithConfig;

interface ContentEntriesViewConfig {
    browser: BrowserConfig;
}

export function useContentEntriesViewConfig() {
    const config = base.useConfig();

    const browser = config.browser || {};

    return useMemo(() => {
        const finalConfig = {
            browser: { ...browser, filters: [...(browser.filters || [])] }
        };

        console.log("config", finalConfig);

        return finalConfig;
    }, [config]);
}
