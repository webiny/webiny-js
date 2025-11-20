import React, { Suspense } from "react";
import { Routes } from "~/routes.js";
import Helmet from "react-helmet";
import {
    PageWorkflowsEditorMenu,
    PageWorkflowsEditorView
} from "~/Components/PageWorkflows/PageWorkflowsEditorView.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { SecureRoute } from "@webiny/app-security/components/index.js";
import { OverlayLoader } from "@webiny/admin-ui";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import { useCanUseWorkflows } from "@webiny/app-workflows";

const t = i18n.namespace("WebsiteBuilder.Page.Workflows.Editor");

interface LoaderProps {
    children: React.ReactNode;
}

const Loader = ({ children, ...props }: LoaderProps) => (
    <Suspense fallback={<OverlayLoader />}>
        {React.cloneElement(children as unknown as React.ReactElement, props)}
    </Suspense>
);

const { Route } = AdminConfig;

export const PageWorkflowsEditor = () => {
    const { canUseWorkflows } = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return null;
    }
    return (
        <AdminConfig>
            <Route
                route={Routes.Pages.Workflows}
                element={
                    <SecureRoute permission={"wb.page"}>
                        <AdminLayout>
                            <Helmet>
                                <title>{t`Workflows`}</title>
                            </Helmet>
                            <Loader>
                                <PageWorkflowsEditorView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                }
            />
            <PageWorkflowsEditorMenu />
        </AdminConfig>
    );
};
