import React from "react";
import Helmet from "react-helmet";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";

export interface WorkflowEditorRouteProps {
    route: Route<any>;
    appBreadcrumbName: string;
    appBreadcrumbLabel: string;
    breadcrumbName: string;
    useCases: IWorkflowEditorUseCases;
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}

/*
 * One workflow editor route per app over the shared view (R202). Only a viewer with the workflows
 * `editor` permission gets the route (D162); the server keeps its own checks.
 */
export const WorkflowEditorRoute = (props: WorkflowEditorRouteProps) => {
    const permission = useWorkflowsPermission();

    if (!permission.editor) {
        return null;
    }

    return (
        <AdminConfig>
            <AdminConfig.Route
                route={props.route}
                element={
                    <AdminLayout>
                        <Helmet>
                            <title>Workflows</title>
                        </Helmet>
                        <AdminConfig.Breadcrumb
                            name={props.appBreadcrumbName}
                            label={props.appBreadcrumbLabel}
                        />
                        <AdminConfig.Breadcrumb name={props.breadcrumbName} label="Workflows" />
                        <WorkflowEditorView
                            useCases={props.useCases}
                            reviewUseCases={props.reviewUseCases}
                            app={props.app}
                        />
                    </AdminLayout>
                }
            />
        </AdminConfig>
    );
};
