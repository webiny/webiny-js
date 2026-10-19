import React from "react";
import Helmet from "react-helmet";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";
import { ExclusionsPage } from "~/settings/presentation/exclusionsPage/components/ExclusionsPage.js";
import { ExclusionsRoute } from "~/settings/routes.js";

/*
 * The Reviewer exclusions route and its Settings menu entries (R330). The route is registered
 * whenever `WorkflowsAdminApp` renders (the flag is on); without the workflows `editor` permission
 * the page shows the no-access view (R329, Q61). The Workflows group and its item show only with
 * `editor` (QBZ-90); the server keeps its own checks.
 */
export const ExclusionsSettings = () => {
    const router = useRouter();
    const permission = useWorkflowsPermission();
    const { Menu } = AdminConfig;

    let menu: React.ReactNode = null;
    if (permission.editor) {
        const link = router.getLink(ExclusionsRoute);
        menu = (
            <>
                <Menu
                    name="settings.workflows"
                    parent="settings"
                    element={<Menu.Group text="Workflows" collapsible={false} />}
                />
                <Menu
                    name="settings.workflows.exclusions"
                    parent="settings.workflows"
                    pinnable={true}
                    element={<Menu.Link text="Reviewer exclusions" to={link} pinnable={true} />}
                />
            </>
        );
    }

    return (
        <AdminConfig>
            <AdminConfig.Route
                route={ExclusionsRoute}
                element={
                    <AdminLayout>
                        <Helmet>
                            <title>Reviewer exclusions</title>
                        </Helmet>
                        <AdminConfig.Breadcrumb name="settings" label="Settings" />
                        <AdminConfig.Breadcrumb name="settings.workflows" label="Workflows" />
                        <AdminConfig.Breadcrumb
                            name="settings.workflows.exclusions"
                            label="Reviewer exclusions"
                        />
                        <ExclusionsPage />
                    </AdminLayout>
                }
            />
            {menu}
        </AdminConfig>
    );
};
