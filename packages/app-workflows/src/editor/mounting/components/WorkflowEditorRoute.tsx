import React from "react";
import Helmet from "react-helmet";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";
import { EditorNoPermission } from "~/editor/presentation/editor/components/EditorNoPermission.js";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";

export interface WorkflowEditorRouteProps {
    route: Route<any>;
    appBreadcrumbName: string;
    appBreadcrumbLabel: string;
    breadcrumbName: string;
    app: WorkflowEditorAppAdapter;
}

/*
 * One workflow editor route per app over the shared view (R202). The route is always registered
 * (the app packages mount it only with the flag on); without the workflows `editor` permission it
 * shows the no-access view and the editor view is not mounted, so no editor query runs (R331,
 * D162). The server keeps its own checks.
 */
export const WorkflowEditorRoute = (props: WorkflowEditorRouteProps) => {
    const permission = useWorkflowsPermission();

    let content: React.ReactNode = <EditorNoPermission />;
    if (permission.editor) {
        content = <WorkflowEditorView app={props.app} />;
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
                        {content}
                    </AdminLayout>
                }
            />
        </AdminConfig>
    );
};
