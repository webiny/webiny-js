import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Browser, BrowserConfig } from "./Browser";

const base = createConfigurableComponent<PageListConfig>("PageListConfig");

export const PageListConfig = Object.assign(base.Config, { Browser });
export const PageListWithConfig = base.WithConfig;

interface PageListConfig {
    browser: BrowserConfig;
}

export function usePageListConfig() {
    const config = base.useConfig();

    const browser = config.browser || {};

    return useMemo(
        () => ({
            browser: {
                ...browser,
                bulkActions: [...(browser.bulkActions || [])]
            }
        }),
        [config]
    );
}
