import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { CompositionScope } from "@webiny/react-composition";
import { Browser, type BrowserConfig } from "./Browser/index.js";
import { PageType } from "./PageType.js";
import { type AcoConfig, useAcoConfig } from "@webiny/app-aco";

const base = createConfigurableComponent<PageListConfig>("WbPageList");

const ScopedPublicPageListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"wbPage"} inherit={true}>
            <base.Config priority={"secondary"}>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedPublicPageListConfig.displayName = "WbPageListConfig";

const ScopedInternalPageListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"wbPage"} inherit={true}>
            <base.Config priority={"primary"}>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedInternalPageListConfig.displayName = "WbPageListConfig";

export const PageListConfig = Object.assign(ScopedPublicPageListConfig, { Browser, PageType });
export const InternalPageListConfig = Object.assign(ScopedInternalPageListConfig, {
    Browser,
    PageType
});
export const PageListWithConfig = base.WithConfig;

interface PageListConfig extends AcoConfig {
    browser: BrowserConfig;
}

export function usePageListConfig() {
    const config = base.useConfig();
    const acoConfig = useAcoConfig(config ?? {});

    const browser = config.browser || {};

    return useMemo(
        () => ({
            browser: {
                ...acoConfig,
                ...browser,
                bulkActions: [...(browser.bulkActions || [])],
                filters: [...(browser.filters || [])],
                filtersToWhere: [...(browser.filtersToWhere || [])],
                sidebarFooter: [...(browser.sidebarFooter || [])]
            }
        }),
        [config]
    );
}
