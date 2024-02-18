import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";

export const Dashboard = makeDecoratable("Dashboard", () => {
    return <DashboardRenderer />;
});

export const DashboardRenderer = makeDecoratable("DashboardRenderer", createVoidComponent());
