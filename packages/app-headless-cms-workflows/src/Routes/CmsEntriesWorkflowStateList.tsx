import React, { Suspense } from "react";
import { Routes } from "~/routes.js";
import Helmet from "react-helmet";
import { CmsWorkflowsMenu } from "~/Components/CmsWorkflows.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { SecureRoute } from "@webiny/app-security/components/index.js";
import { OverlayLoader } from "@webiny/admin-ui";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import { useCanUseWorkflows, WorkflowStateListView } from "@webiny/app-workflows";
import { useApolloClient } from "@apollo/react-hooks";
import { useContentEntry } from "@webiny/app-headless-cms";

const t = i18n.namespace("HeadlessCms.Entries.WorkflowStateList");

interface LoaderProps {
    children: React.ReactNode;
}

const Loader = ({ children, ...props }: LoaderProps) => (
    <Suspense fallback={<OverlayLoader />}>
        {React.cloneElement(children as unknown as React.ReactElement, props)}
    </Suspense>
);

const { Route } = AdminConfig;

export const CmsEntriesWorkflowStateList = () => {
    const client = useApolloClient();
    const { contentModel: model } = useContentEntry();
    const { canUseWorkflows } = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return null;
    }

    return (
        <AdminConfig>
            <Route
                route={Routes.ContentEntries.WorkflowStateList}
                element={
                    <SecureRoute permission={"cms.contentModel"}>
                        <AdminLayout>
                            <Helmet>
                                <title>{t`Workflows`}</title>
                            </Helmet>
                            <Loader>
                                <WorkflowStateListView
                                    client={client}
                                    app={`cms.${model.modelId}`}
                                />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                }
            />
            <CmsWorkflowsMenu />
        </AdminConfig>
    );
};
