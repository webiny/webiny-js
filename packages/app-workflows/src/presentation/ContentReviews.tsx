import React from "react";
import { WorkflowsMenu } from "./workflowStateList/components/WorkflowsMenu.js";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import Helmet from "react-helmet";
import { Routes } from "~/routes.js";
import { WorkflowStateListView } from "~/presentation/workflowStateList/components/List/WorkflowStateListView.js";
import { WorkflowStatesOwnWidget } from "~/presentation/workflowStatesWidget/components/WorkflowStatesOwnWidget.js";
import { WorkflowStatesRequestedWidget } from "~/presentation/workflowStatesWidget/components/WorkflowStatesRequestedWidget.js";

const { Route } = AdminConfig;

export const ContentReviews = () => {
    return (
        <AdminConfig>
            <Route
                route={Routes.Workflows.ContentReviews}
                element={
                    <AdminLayout>
                        <Helmet>
                            <title>{`Content Reviews`}</title>
                        </Helmet>
                        <WorkflowStateListView />
                    </AdminLayout>
                }
            />
            <WorkflowsMenu />

            <AdminConfig.Dashboard.Widget
                name="workflows.requested"
                column="right"
                element={<WorkflowStatesRequestedWidget />}
            />
            <AdminConfig.Dashboard.Widget
                name="workflows.own"
                column="right"
                element={<WorkflowStatesOwnWidget />}
            />
        </AdminConfig>
    );
};
