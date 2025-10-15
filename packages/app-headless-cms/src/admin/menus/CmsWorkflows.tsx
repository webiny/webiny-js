import React, { useCallback, useMemo } from "react";
import { AdminConfig, useRoute, useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";
import type { IWorkflowApplication } from "@webiny/app-workflows";
import { useCanUseWorkflows, Workflows } from "@webiny/app-workflows";
import { Alert, Icon } from "@webiny/admin-ui";
import { useModels, usePermission } from "~/admin/hooks/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

const { Menu } = AdminConfig;

interface ICmsWorkflowsMenuProps {
    canAccess: boolean;
}

export const CmsWorkflowsMenu = (props: ICmsWorkflowsMenuProps) => {
    const { canAccess } = props;
    const router = useRouter();
    const canUseWorkflows = useCanUseWorkflows();
    if (!canAccess || !canUseWorkflows) {
        return null;
    }
    return (
        <Menu
            name={"headlessCMS.contentModels.workflows"}
            parent={"headlessCMS"}
            element={
                <Menu.Link text={"Workflows"} to={router.getLink(Routes.ContentModels.Workflows)} />
            }
        />
    );
};

interface IModelIconProps {
    model: Pick<CmsModel, "icon" | "name">;
}

const ModelIcon = ({ model }: IModelIconProps) => {
    if (!model.icon) {
        return null;
    }
    return (
        <Icon
            icon={<FontAwesomeIcon icon={(model.icon || "").split("/") as IconProp} />}
            label={model.name}
            size={"sm"}
            className={"wby-text-neutral-strong"}
        />
    );
};

export const CmsWorkflowsView = () => {
    const { route } = useRoute(Routes.ContentModels.Workflows);
    const { models } = useModels();
    const { canEdit } = usePermission();
    const { goToRoute } = useRouter();

    const apps = useMemo<IWorkflowApplication[]>(() => {
        return models
            .filter(model => canEdit(model, "cms.contentModel"))
            .map(model => {
                return {
                    id: `cms:${model.modelId}`,
                    name: model.name,
                    icon: <ModelIcon model={model} />
                };
            });
    }, [models, canEdit]);

    const onAppClick = useCallback(
        (id: string) => {
            goToRoute(Routes.ContentModels.Workflows, {
                id: id.replace("cms:", "")
            });
        },
        [apps]
    );

    const app = useMemo(() => {
        if (!route.params.id) {
            return undefined;
        }
        return `cms:${route.params.id}`;
    }, [route]);

    return (
        <Workflows apps={apps} onAppClick={onAppClick} app={app}>
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                Access denied! TBD
            </Alert>
        </Workflows>
    );
};
