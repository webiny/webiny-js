import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Browser, type BrowserConfig } from "./Browser/index.js";
import { useAcoConfig } from "@webiny/app-aco";

const base = createConfigurableComponent<RedirectListConfig>("WbRedirectList");

const ScopedRedirectListConfig = ({ children }: { children: React.ReactNode }) => {
    return <base.Config>{children}</base.Config>;
};

ScopedRedirectListConfig.displayName = "WbRedirectListConfig";

export const RedirectListConfig = Object.assign(ScopedRedirectListConfig, { Browser });
export const RedirectListWithConfig = base.WithConfig;

interface RedirectListConfig {
    browser: BrowserConfig;
}

export function useRedirectListConfig() {
    const config = base.useConfig();
    const acoConfig = useAcoConfig(config);

    const browser = config.browser || {};

    return useMemo(
        () => ({
            browser: {
                ...browser,
                bulkActions: [...(browser.bulkActions || [])],
                filters: [...(browser.filters || [])],
                filtersToWhere: [...(browser.filtersToWhere || [])],
                table: acoConfig.table,
                folder: acoConfig.folder,
                redirect: acoConfig.record
            }
        }),
        [config]
    );
}
