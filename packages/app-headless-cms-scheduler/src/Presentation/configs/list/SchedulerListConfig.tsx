import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Browser, BrowserConfig } from "./Browser";
import { CompositionScope } from "@webiny/react-composition";

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

    const browser = config.browser || {};

    return useMemo(
        () => ({
            browser: {
                ...browser,
                bulkActions: []
            }
        }),
        [config]
    );
}
