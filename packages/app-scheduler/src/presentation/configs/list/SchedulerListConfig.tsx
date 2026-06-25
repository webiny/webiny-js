import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { BrowserConfig } from "./Browser/index.js";
import { Browser } from "./Browser/index.js";
import { CompositionScope } from "@webiny/react-composition";
import { useAcoConfig } from "@webiny/app-aco";

const base = createConfigurableComponent<SchedulerListConfig>("SchedulerListConfig");

const ScopedSchedulerListConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"scheduler"}>
            <base.Config>{children}</base.Config>
        </CompositionScope>
    );
};

ScopedSchedulerListConfig.displayName = "SchedulerListConfig";

export const SchedulerListConfig = Object.assign(ScopedSchedulerListConfig, { Browser });
export const SchedulerListWithConfig = base.WithConfig;

interface SchedulerListConfig {
    browser: BrowserConfig;
}

export function useSchedulerListConfig() {
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
