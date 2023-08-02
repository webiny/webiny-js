import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Widget, WidgetConfig } from "./configComponents/Widget";
import { DashboardView } from "~/base/ui/Dashboard";

const base = createConfigurableComponent<DashboardConfigData>("Dashboard");

export const DashboardConfig = Object.assign(base.Config, {
    Widget,
    View: DashboardView
});

export const DashboardWithConfig = base.WithConfig;

interface DashboardConfigData {
    widgets: WidgetConfig[];
}

export function useDashboardConfig() {
    const config = base.useConfig();

    const widgets = config.widgets || [];

    return useMemo(() => ({ widgets }), [config]);
}
