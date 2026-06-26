import React, { Suspense } from "react";
import { Routes } from "~/routes.js";
import Helmet from "react-helmet";
import { i18n } from "@webiny/app/i18n/index.js";
import { SecureRoute } from "@webiny/app-admin";
import { OverlayLoader } from "@webiny/admin-ui";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import { useCanUseWorkflows } from "@webiny/app-workflows";
import { CmsWorkflowsEditorView } from "~/presentation/CmsWorkflowsEditorView.js";
import { CmsWorkflowsEditorMenu } from "~/presentation/CmsWorkflowsEditorView.js";

const t = i18n.namespace("HeadlessCms.Workflows.Editor");

interface LoaderProps {
    children: React.ReactNode;
}

const Loader = ({ children, ...props }: LoaderProps) => (
    <Suspense fallback={<OverlayLoader />}>
        {React.cloneElement(children as unknown as React.ReactElement, props)}
    </Suspense>
);

const { Route } = AdminConfig;

export const CmsWorkflowsEditor = () => {
    const { canUseWorkflows } = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return null;
    }
    return (
        <AdminConfig>
            <Route
                route={Routes.ContentModels.Workflows}
                element={
                    <SecureRoute permission={"cms.contentModel"}>
                        <AdminLayout>
                            <Helmet>
                                <title>{t`Workflows`}</title>
                            </Helmet>
                            <Loader>
                                <CmsWorkflowsEditorView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                }
            />
            <CmsWorkflowsEditorMenu />
        </AdminConfig>
    );
};
