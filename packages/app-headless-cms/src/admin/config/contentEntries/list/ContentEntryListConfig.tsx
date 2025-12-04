import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { BrowserConfig } from "./Browser/index.js";
import { Browser } from "./Browser/index.js";
import { CompositionScope } from "@webiny/react-composition";
import { useAcoConfig } from "@webiny/app-aco";

const base = createConfigurableComponent<ContentEntryListConfig>("ContentEntryListConfig");

const InternalEntryListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"cms"}>
            <base.Config priority={"primary"}>{children}</base.Config>
        </CompositionScope>
    );
};

const PublicContentEntryListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"cms"}>
            <base.Config priority={"secondary"}>{children}</base.Config>
        </CompositionScope>
    );
};

PublicContentEntryListConfig.displayName = "ContentEntryListConfig";

/* This one is a public API for other apps and third party developers. */
export const ContentEntryListConfig = Object.assign(PublicContentEntryListConfig, { Browser });

/* This one is an internal API for the base app. It ensures this config is always applied first. */
export const InternalContentEntryListConfig = Object.assign(InternalEntryListConfig, { Browser });

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
                filtersToWhere: [...(browser.filtersToWhere || [])]
            }
        }),
        [config]
    );
}
