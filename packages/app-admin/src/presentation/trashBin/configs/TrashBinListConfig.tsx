import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { BrowserConfig } from "./Browser/index.js";
import { Browser } from "./Browser/index.js";
import { CompositionScope } from "@webiny/react-composition";

const base = createConfigurableComponent<TrashBinListConfig>("TrashBinListConfig");

const ScopedTrashBinListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"trash"}>
            <base.Config>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedTrashBinListConfig.displayName = "TrashBinListConfig";

export const TrashBinListConfig = Object.assign(ScopedTrashBinListConfig, { Browser });
export const TrashBinListWithConfig = base.WithConfig;

interface TrashBinListConfig {
    browser: BrowserConfig;
}

export function useTrashBinListConfig() {
    const config: Record<string, any> = base.useConfig();
    const browser = config.browser || {};
    const record = config.record || {};
    const table = config.table || {};

    return useMemo(
        () => ({
            browser: {
                ...browser,
                table: {
                    columns: [...(table.columns || [])],
                    sorting: [...(table.sorting || [])]
                },
                entryActions: [...(record.actions || [])],
                bulkActions: [...(browser.bulkActions || [])]
            }
        }),
        [config]
    );
}
