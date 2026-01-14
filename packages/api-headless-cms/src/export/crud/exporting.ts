import type { HeadlessCmsExportStructure, SanitizedCmsModel } from "~/export/types.js";
import type { CmsContext } from "~/types/index.js";
import { sanitizeGroup, sanitizeModel } from "./sanitize.js";

export const createExportStructureContext = (context: CmsContext): HeadlessCmsExportStructure => {
    return async params => {
        const { models: modelIdList } = params;
        const groups = (await context.cms.listGroups()).map(sanitizeGroup);
        /**
         * We need all the models which:
         * * are accessible by current user
         * * are not private
         * * are included (if targets are provided)
         * * are part of one of the groups we already fetched
         */
        const models = (await context.cms.listModels())
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
