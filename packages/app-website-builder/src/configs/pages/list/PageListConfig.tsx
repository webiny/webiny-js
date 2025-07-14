import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { CompositionScope } from "@webiny/react-composition";
import { Browser, BrowserConfig } from "./Browser";

const base = createConfigurableComponent<PageListConfig>("WbPageListConfig");

const ScopedPageListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"wbPage"}>
            <base.Config>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedPageListConfig.displayName = "WbPageListConfig";

export const PageListConfig = Object.assign(ScopedPageListConfig, { Browser });
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
                bulkActions: [...(browser.bulkActions || [])],
                filters: [...(browser.filters || [])],
                filtersToWhere: [...(browser.filtersToWhere || [])]
            }
        }),
        [config]
    );
}
