import { HeadlessCmsExportStructureParamsTargets } from "~/export/types";
import { CmsGroup, CmsModel } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsGroupPlugin, CmsModelPlugin } from "~/plugins";

type PickedGroup = Pick<CmsGroup, "id" | "slug" | "isPrivate">;
type PickedModel = Pick<CmsModel, "modelId" | "group" | "isPrivate">;

interface Targeting {
    isGroupAllowed: (group: PickedGroup) => boolean;
    isModelAllowed: (model: PickedModel) => boolean;
}

const createTargetFiltering = (
    initialTargets?: HeadlessCmsExportStructureParamsTargets[]
): Targeting => {
    return {
        isGroupAllowed: group => {
            if (group.isPrivate) {
                return false;
            } else if (!initialTargets) {
                return true;
            }
            return initialTargets.some(target => {
                return target.id === group.id;
            });
        },
        isModelAllowed: model => {
            if (model.isPrivate) {
                return false;
            } else if (!initialTargets) {
                return true;
            }
            return initialTargets.some(target => {
                if (target.id === model.group.id) {
                    if (!target.models || target.models.includes(model.modelId)) {
                        return true;
                    }
                }
                return false;
            });
        }
    };
};

export interface FilteringParams {
    code: boolean;
    plugins: PluginsContainer;
    targets?: HeadlessCmsExportStructureParamsTargets[];
}

export const createFiltering = (params: FilteringParams) => {
    const { targets: initialTargets, plugins, code } = params;

    const filtering = createTargetFiltering(initialTargets);

    const groupPluginIdList = plugins.byType<CmsGroupPlugin>(CmsGroupPlugin.type).map(pl => {
        return pl.contentModelGroup.id;
    });
    const modelPluginIdList = plugins.byType<CmsModelPlugin>(CmsModelPlugin.type).map(pl => {
        return `${pl.contentModel.group.id}:${pl.contentModel.modelId}`;
    });

    return {
        group: (group: PickedGroup) => {
            if (groupPluginIdList.includes(group.id) && !code) {
                return false;
            }
            return filtering.isGroupAllowed(group);
        },
        model: (model: PickedModel) => {
            const key = `${model.group.id}:${model.modelId}`;
            if (modelPluginIdList.includes(key) && !code) {
                return false;
            }
            return filtering.isModelAllowed(model);
        }
    };
};
