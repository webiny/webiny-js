import React from "react";
import { makeComposable } from "@webiny/app-core";

export const Dashboard = makeComposable("Dashboard", () => {
    return <DashboardRenderer />;
});

export const DashboardRenderer = makeComposable("DashboardRenderer");
