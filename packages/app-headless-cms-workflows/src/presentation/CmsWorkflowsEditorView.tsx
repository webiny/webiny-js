import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { AdminConfig, useRoute, useRouter } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { Routes } from "~/routes.js";
import type { IWorkflowApplication } from "@webiny/app-workflows";
import { Components } from "@webiny/app-workflows";
import { Icon, Loader } from "@webiny/admin-ui";
import { usePermission } from "@webiny/app-headless-cms/admin/hooks/index.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { normalizeIcon } from "@webiny/app-headless-cms/utils/normalizeIcon.js";
import { CmsWorkflowsEditorPresenterFeature } from "~/presentation/cmsWorkflowsEditor/feature.js";
import type { WorkflowApp } from "~/presentation/cmsWorkflowsEditor/abstractions.js";

const {
    Admin: { WorkflowsEditor },
    Permissions: { HasWorkflowsEditorPermission }
} = Components;

const { Menu } = AdminConfig;

export const CmsWorkflowsEditorMenu = () => {
    const router = useRouter();
    const { canCreateContentModels } = usePermission();

    if (!canCreateContentModels) {
        return null;
    }

    return (
        <HasWorkflowsEditorPermission>
            <Menu
                name={"headlessCMS.contentModels.workflows"}
                parent={"headlessCMS"}
                element={
                    <Menu.Link
                        pinnable={true}
                        text={"Workflows"}
                        to={router.getLink(Routes.ContentModels.Workflows)}
                    />
                }
            />
        </HasWorkflowsEditorPermission>
    );
};

const ModelIcon = ({ app }: { app: WorkflowApp }) => {
    if (!app.icon) {
        return null;
    }

    const icon = normalizeIcon(app.icon);
    if (!icon) {
        return null;
    }

    return (
        <Icon
            icon={<FontAwesomeIcon icon={icon} />}
            label={app.name}
            size={"sm"}
            className={"text-neutral-strong"}
        />
    );
};

export const CmsWorkflowsEditorView = observer(() => {
    const { route } = useRoute(Routes.ContentModels.Workflows);
    const { presenter } = useFeature(CmsWorkflowsEditorPresenterFeature);
    const { canCreateContentModels } = usePermission();
    const { goToRoute } = useRouter();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { loading, apps: workflowApps } = presenter.vm;

    const apps = useMemo<IWorkflowApplication[]>(() => {
        return workflowApps.map(app => ({
            id: app.id,
            name: app.name,
            icon: <ModelIcon app={app} />
        }));
    }, [workflowApps]);

    const app = useMemo(() => {
        if (!route.params.app) {
            // Find first app
            return apps.find(() => true);
        }
        return apps.find(a => a.id === route.params.app) || null;
    }, [route.params.app, apps]);

    const onAppClick = useCallback(
        (id: string) => {
            goToRoute(Routes.ContentModels.Workflows, {
                app: id
            });
        },
        [apps]
    );

    if (!canCreateContentModels) {
        return null;
    } else if (loading) {
        return <Loader size="lg" variant="accent" indeterminate={true} text="Loading..." />;
    }

    return <WorkflowsEditor apps={apps} onAppClick={onAppClick} app={app?.id} />;
});
