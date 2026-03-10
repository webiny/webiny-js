import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { BrowserConfig } from "./Browser/index.js";
import { Browser } from "./Browser/index.js";
import { CompositionScope } from "@webiny/react-composition";
import { useAcoConfig } from "@webiny/app-aco";

const base = createConfigurableComponent<WbSchedulerListConfig>("WbSchedulerListConfig");

const ScopedWbSchedulerListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"wb-scheduler"}>
            <base.Config>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedWbSchedulerListConfig.displayName = "WbSchedulerListConfig";

export const WbSchedulerListConfig = Object.assign(ScopedWbSchedulerListConfig, { Browser });
export const WbSchedulerListWithConfig = base.WithConfig;

interface WbSchedulerListConfig {
    browser: BrowserConfig;
}

export function useWbSchedulerListConfig() {
    const config = base.useConfig();
    const acoConfig = useAcoConfig(config);

    return useMemo(
        () => ({
            browser: {
                table: acoConfig.table,
                entryActions: acoConfig.record.actions,
                bulkActions: []
            }
        }),
        [config]
    );
}
