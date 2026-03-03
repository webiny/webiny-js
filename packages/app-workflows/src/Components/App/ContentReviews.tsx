import React from "react";
import { WorkflowsMenu } from "~/Components/AdminConfig/WorkflowsMenu.js";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import { useApolloClient } from "@apollo/client/react";
import Helmet from "react-helmet";
import { Routes } from "~/routes.js";
import { WorkflowStateListView } from "~/Components/WorkflowStateList/index.js";
import {
    WorkflowStatesOwnWidget,
    WorkflowStatesRequestedWidget
} from "~/Components/WorkflowStatesWidget/index.js";

const { Route } = AdminConfig;

export const ContentReviews = () => {
    const client = useApolloClient();
    return (
        <AdminConfig>
            <Route
                route={Routes.Workflows.ContentReviews}
                element={
                    <AdminLayout>
                        <Helmet>
                            <title>{`Content Reviews`}</title>
                        </Helmet>
                        <WorkflowStateListView client={client} />
                    </AdminLayout>
                }
            />
            <WorkflowsMenu />

            <AdminConfig.Dashboard.Widget
                name="workflows.requested"
                column="right"
                element={<WorkflowStatesRequestedWidget client={client} />}
            />
            <AdminConfig.Dashboard.Widget
                name="workflows.own"
                column="right"
                element={<WorkflowStatesOwnWidget client={client} />}
            />
        </AdminConfig>
    );
};
