import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { BrowserConfig } from "./Browser/index.js";
import { Browser } from "./Browser/index.js";
import type { DetailsConfig } from "./Details/index.js";
import { Details } from "./Details/index.js";
import { CompositionScope } from "@webiny/react-composition";

const base = createConfigurableComponent<AuditLogsListConfig>("AuditLogsListConfig");

const ScopedAuditLogsListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"auditLogs"}>
            <base.Config>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedAuditLogsListConfig.displayName = "AuditLogsListConfig";

export const AuditLogsListConfig = Object.assign(ScopedAuditLogsListConfig, { Browser, Details });
export const AuditLogsListWithConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"auditLogs"}>
            <base.WithConfig>{children}</base.WithConfig>
        </CompositionScope>
    );
};

interface AuditLogsListConfig {
    browser: BrowserConfig;
    details: DetailsConfig;
}

export function useAuditLogsListConfig() {
    const config = base.useConfig();

    const browser = config.browser || {};
    const details = config.details || {};

    return useMemo(
        () => ({
            browser: {
                ...browser,
                filters: [...(browser.filters || [])],
                filtersToWhere: [...(browser.filtersToWhere || [])]
            },
            details: {
                ...details,
                tabs: [...(details.tabs || [])]
            }
        }),
        [config]
    );
}
