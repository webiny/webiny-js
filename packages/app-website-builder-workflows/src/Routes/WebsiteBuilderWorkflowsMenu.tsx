import React from "react";
import { useFeature } from "@webiny/app";
import { WorkflowEditorMenu } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorMenu.js";
import { WorkflowEditorRoute } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorRoute.js";
import { WbWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared workflow editor route and menu item with the Website Builder use cases and
 * adapter. Both render nothing without the workflows `editor` permission (D162).
 */
export const WebsiteBuilderWorkflowsMenu = () => {
    const { useCases, reviewUseCases, app } = useFeature(WbWorkflowEditorMountingFeature);

    return (
        <>
            <WorkflowEditorRoute
                route={Routes.Pages.Workflows}
                appBreadcrumbName="wb"
                appBreadcrumbLabel="Website Builder"
                breadcrumbName="wb.workflows"
                useCases={useCases}
                reviewUseCases={reviewUseCases}
                app={app}
            />
            <WorkflowEditorMenu
                name="websiteBuilder.pages.workflows"
                parent="wb"
                route={Routes.Pages.Workflows}
            />
        </>
    );
};
