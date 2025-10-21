import React, { useCallback, useMemo } from "react";
import { AdminConfig, useRoute, useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";
import type { IWorkflowApplication } from "@webiny/app-workflows";
import { Workflows } from "@webiny/app-workflows";
import { Alert, Icon, Loader } from "@webiny/admin-ui";
import { useModels, usePermission } from "@webiny/app-headless-cms/admin/hooks/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

const { Menu } = AdminConfig;

export const CmsWorkflowsMenu = () => {
    const router = useRouter();
    const { canCreateContentModels } = usePermission();

    if (!canCreateContentModels) {
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
    const { models, loading } = useModels();
    const { canEdit, canCreateContentModels } = usePermission();
    const { goToRoute } = useRouter();

    const apps = useMemo<IWorkflowApplication[]>(() => {
        return models
            .filter(model => canEdit(model, "cms.contentModel"))
            .map(model => {
                return {
                    id: `cms.${model.modelId}`,
                    name: model.name,
                    icon: <ModelIcon model={model} />
                };
            });
    }, [models, canEdit]);

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
        return (
            <div className="wby-flex wby-flex-col wby-items-center wby-gap-4 wby-pt-lg">
                <Loader size="md" variant="accent" indeterminate={true} text="Loading..." />
            </div>
        );
    }

    return (
        <Workflows apps={apps} onAppClick={onAppClick} app={route.params.app}>
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                You do not have access to Workflows. Please contact your system administrator.
            </Alert>
        </Workflows>
    );
};
