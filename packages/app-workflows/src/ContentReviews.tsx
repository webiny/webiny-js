import React from "react";
import { WorkflowsMenu } from "~/Components/AdminConfig/WorkflowsMenu.js";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import Helmet from "react-helmet";
import { Routes } from "~/routes.js";
import { SecureRoute } from "@webiny/app-security/components/index.js";
import { WorkflowStateListView } from "~/Components/WorkflowStateList/index.js";
import { useApolloClient } from "@apollo/react-hooks";

const { Route } = AdminConfig;

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
        </AdminConfig>
    );
};
