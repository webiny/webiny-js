import React from "react";
import { useFeature } from "@webiny/app";
import { WorkflowEditorMenu } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorMenu.js";
import { WorkflowEditorRoute } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorRoute.js";
import { CmsWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared workflow editor route and menu item with the CMS adapter. Without the workflows
 * `editor` permission the menu item renders nothing and the route shows the no-access view (D162,
 * R331).
 */
export const CmsWorkflowEditor = () => {
    const { app } = useFeature(CmsWorkflowEditorMountingFeature);

    return (
        <>
            <WorkflowEditorRoute
                route={Routes.ContentModels.Workflows}
                appBreadcrumbName="cms"
                appBreadcrumbLabel="Headless CMS"
                breadcrumbName="cms.workflows"
                app={app}
            />
            <WorkflowEditorMenu
                name="headlessCMS.contentModels.workflows"
                parent="headlessCMS"
                route={Routes.ContentModels.Workflows}
            />
        </>
    );
};
