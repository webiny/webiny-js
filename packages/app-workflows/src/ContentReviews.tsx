import React from "react";
import { WorkflowsMenu } from "~/Components/AdminConfig/WorkflowsMenu.js";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import Helmet from "react-helmet";
import { Routes } from "~/routes.js";
import { SecureRoute, HasPermission } from "@webiny/app-security/components/index.js";
import { WorkflowStateListView } from "~/Components/WorkflowStateList/index.js";
import { WorkflowStatesOwnWidget, WorkflowStatesRequestedWidget } from "~/Components/WorkflowStatesWidget/index.js";
import { useApolloClient } from "@apollo/react-hooks";

const { Route, Widget } = AdminConfig;

export const ContentReviews = () => {
    const client = useApolloClient();
    return (
        <AdminConfig>
            <Route
                route={Routes.Workflows.ContentReviews}
                element={
                    <SecureRoute permission={"workflows.contentReviews"}>
                        <AdminLayout>
                            <Helmet>
                                <title>{`Content Reviews`}</title>
                            </Helmet>

                            <WorkflowStateListView client={client} />
                        </AdminLayout>
                    </SecureRoute>
                }
            />
            <WorkflowsMenu />

            <SecureRoute permission={"workflows.contentReviews"}>
                <Widget
                    name="workflows.own"
                    column={2}
                    order={10}
                    element={<WorkflowStatesOwnWidget client={client} />}
                />
                <Widget
                    name="workflows.requested"
                    column={2}
                    order={20}
                    element={<WorkflowStatesRequestedWidget client={client} />}
                />
            </SecureRoute>
        </AdminConfig>
    );
};
