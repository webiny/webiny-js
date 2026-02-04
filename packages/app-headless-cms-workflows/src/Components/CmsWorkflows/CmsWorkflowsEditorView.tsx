import React, { useCallback, useMemo } from "react";
import { AdminConfig, useRoute, useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";
import type { IWorkflowApplication } from "@webiny/app-workflows";
import { Components } from "@webiny/app-workflows";
import { Icon, Loader } from "@webiny/admin-ui";
import { useModels, usePermission } from "@webiny/app-headless-cms/admin/hooks/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createAppName } from "~/utils/appName.js";
import { normalizeIcon } from "@webiny/app-headless-cms/utils/normalizeIcon.js";

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

interface IModelIconProps {
    model: Pick<CmsModel, "icon" | "name">;
}

const ModelIcon = ({ model }: IModelIconProps) => {
    if (!model.icon) {
        return null;
    }

    const icon = normalizeIcon(model.icon);
    if (!icon) {
        return null;
    }

    return (
        <Icon
            icon={<FontAwesomeIcon icon={icon} />}
            label={model.name}
            size={"sm"}
            className={"text-neutral-strong"}
        />
    );
};

const isAllowed = (model: Pick<CmsModel, "modelId" | "tags">) => {
    // Exclude models that have the "$publishing:false" tag
    if (model.tags.includes("$publishing:false")) {
        return false;
    }
    // Exclude single entry models
    else if (model.tags.includes("singleEntry")) {
        return false;
    }

    return true;
};

export const CmsWorkflowsEditorView = () => {
    const { route } = useRoute(Routes.ContentModels.Workflows);
    const { models, loading } = useModels();
    const { canEdit, canCreateContentModels } = usePermission();
    const { goToRoute } = useRouter();

    const apps = useMemo<IWorkflowApplication[]>(() => {
        return models
            .filter(model => {
                if (isAllowed(model) === false) {
                    return false;
                }
                return canEdit(model, "cms.contentModel");
            })
            .map(model => {
                return {
                    id: createAppName(model),
                    name: model.name,
                    icon: <ModelIcon model={model} />
                };
            });
    }, [models, canEdit]);

    const app = useMemo(() => {
        if (!route.params.app) {
            return apps.find(() => true);
        }
        return apps.find(a => a.id === route.params.app) || null;
    }, [route.params.app]);

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
};
