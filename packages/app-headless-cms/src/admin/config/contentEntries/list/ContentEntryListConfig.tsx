import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { BrowserConfig } from "./Browser/index.js";
import { Browser } from "./Browser/index.js";
import { CompositionScope } from "@webiny/react-composition";
import { useAcoConfig } from "@webiny/app-aco";

const base = createConfigurableComponent<ContentEntryListConfig>("ContentEntryListConfig");

const ScopedContentEntryListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"cms"}>
            <base.Config>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedContentEntryListConfig.displayName = "ContentEntryListConfig";

export const ContentEntryListConfig = Object.assign(ScopedContentEntryListConfig, { Browser });
export const ContentEntryListWithConfig = base.WithConfig;

interface ContentEntryListConfig {
    browser: BrowserConfig;
}

export function useContentEntryListConfig() {
    const config = base.useConfig();
    const acoConfig = useAcoConfig(config);

    const browser = config.browser || {};

    return useMemo(
        () => ({
            browser: {
                advancedSearch: acoConfig.advancedSearch,
                table: acoConfig.table,
                folder: acoConfig.folder,
                entry: acoConfig.record,
                bulkActions: [...(browser.bulkActions || [])],
                filters: [...(browser.filters || [])],
                filtersToWhere: [...(browser.filtersToWhere || [])],
            }
        }),
        [config]
    );
}
