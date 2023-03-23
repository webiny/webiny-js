import * as React from "react";
import {
    CenteredView,
    Compose,
    DashboardRenderer as DashboardRendererSpec
} from "@webiny/app-admin";
import Welcome from "./Welcome";

const DashboardRendererHOC = (): React.VFC => {
    return function DashboardRenderer() {
        return (
            <CenteredView maxWidth={1300}>
                <Welcome />
            </CenteredView>
        );
    };
};

export const Dashboard: React.VFC = () => {
    return <Compose component={DashboardRendererSpec} with={DashboardRendererHOC} />;
};
