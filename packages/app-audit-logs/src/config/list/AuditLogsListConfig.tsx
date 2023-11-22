import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Browser, BrowserConfig } from "./Browser";

const base = createConfigurableComponent<AuditLogsListConfig>("AuditLogsListConfig");

export const AuditLogsListConfig = Object.assign(base.Config, { Browser });
export const AuditLogsListWithConfig = base.WithConfig;

interface AuditLogsListConfig {
    browser: BrowserConfig;
}

export function useAuditLogsListConfig() {
    const config = base.useConfig();

    const browser = config.browser || {};

    return useMemo(
        () => ({
            browser: {
                ...browser,
                filters: [...(browser.filters || [])],
                filtersToWhere: [...(browser.filtersToWhere || [])]
            }
        }),
        [config]
    );
}
