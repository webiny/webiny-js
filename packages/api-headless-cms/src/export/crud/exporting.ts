import type { HeadlessCmsExportStructure, SanitizedCmsModel } from "~/export/types.js";
import type { CmsContext } from "~/types/index.js";
import { sanitizeGroup, sanitizeModel } from "./sanitize.js";
import { ListGroupsUseCase } from "~/features/contentModelGroup/ListGroups/index.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";

export const createExportStructureContext = (context: CmsContext): HeadlessCmsExportStructure => {
    return async params => {
        const { models: modelIdList } = params;

        const groupsResult = await context.container.resolve(ListGroupsUseCase).execute();
        if (groupsResult.isFail()) {
            throw groupsResult.error;
        }
        const groups = groupsResult.value.map(sanitizeGroup);

        /**
         * We need all the models which:
         * * are accessible by current user
         * * are not private
         * * are included (if targets are provided)
         * * are part of one of the groups we already fetched
         */
        const modelsResult = await context.container.resolve(ListModelsUseCase).execute();
        if (modelsResult.isFail()) {
            throw modelsResult.error;
        }
        const models = modelsResult.value
            .filter(model => {
                if (model.isPrivate) {
                    return false;
                } else if (!model.fields?.length) {
                    return false;
                } else if (!modelIdList?.length) {
                    return true;
                }
                return modelIdList.includes(model.modelId);
            })
            .map(model => {
                const group = groups.find(group => group.slug === model.group);
                if (!group) {
                    return null;
                }
                return sanitizeModel(group, model);
            })
            .filter((model): model is SanitizedCmsModel => {
                return !!model;
            });

        return {
            groups: groups.filter(group => {
                return models.some(model => model.group === group.slug);
            }),
            models
        };
    };
};
