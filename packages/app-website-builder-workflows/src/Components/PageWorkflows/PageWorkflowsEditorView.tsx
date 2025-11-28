import React, { useCallback, useMemo } from "react";
import { AdminConfig, useRoute, useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";
import type { IWorkflowApplication } from "@webiny/app-workflows";
import { Components } from "@webiny/app-workflows";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as WorkflowsIcon } from "@webiny/icons/workspaces.svg";
import { WB_PAGE_APP } from "~/constants.js";

const {
    Admin: { WorkflowsEditor }
} = Components;

const { Menu } = AdminConfig;

export const PageWorkflowsEditorMenu = () => {
    const router = useRouter();

    return (
        <Menu
            name={"websiteBuilder.pages.workflows"}
            pinnable={true}
            parent={"wb"}
            element={<Menu.Link text={"Workflows"} to={router.getLink(Routes.Pages.Workflows)} />}
        />
    );
};

export const PageWorkflowsEditorView = () => {
    const { route } = useRoute(Routes.Pages.Workflows);
    const { goToRoute } = useRouter();

    const apps = useMemo<IWorkflowApplication[]>(() => {
        return [
            {
                id: WB_PAGE_APP,
                name: "Pages",
                icon: <Icon icon={<WorkflowsIcon />} label={"Pages Workflows"} />
            }
        ];
    }, []);

    const onAppClick = useCallback(
        (id: string) => {
            goToRoute(Routes.Pages.Workflows, {
                app: id
            });
        },
        [apps]
    );

    const app = useMemo(() => {
        return apps.find(a => a.id === route.params.app) || apps[0];
    }, [route.params.app, apps]);

    return <WorkflowsEditor apps={apps} onAppClick={onAppClick} app={app.id} />;
};
