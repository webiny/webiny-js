import React from "react";
import { WorkflowsMenu } from "~/Components/AdminConfig/WorkflowsMenu.js";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import { useApolloClient } from "@apollo/react-hooks";
import Helmet from "react-helmet";
import { Routes } from "~/routes.js";
import { WorkflowStateListView } from "~/Components/WorkflowStateList/index.js";
import {
    WorkflowStatesOwnWidget,
    WorkflowStatesRequestedWidget
} from "~/Components/WorkflowStatesWidget/index.js";
import { HasPermission } from "@webiny/app-security/components/index.js";

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

            <HasPermission name={"workflows.contentReviews"}>
                <AdminConfig.Dashboard.Widget
                    name="workflows.requested"
                    column="right"
                    element={<WorkflowStatesRequestedWidget client={client} />}
                />
                <AdminConfig.Dashboard.Widget
                    name="workflows.assigned"
                    column="right"
                    element={<WorkflowStatesOwnWidget client={client} />}
                />
            </HasPermission>
        </AdminConfig>
    );
};
