import * as React from "react";
import {
    CenteredView,
    Compose,
    DashboardRenderer as DashboardRendererSpec
} from "@webiny/app-admin";
import Welcome from "./Welcome";

const DashboardRendererHOC = () => {
    return function DashboardRenderer() {
        return (
            <CenteredView maxWidth={1300}>
                <Welcome />
            </CenteredView>
        );
    };
};

export const Dashboard = () => {
    return <Compose component={DashboardRendererSpec} with={DashboardRendererHOC} />;
};
