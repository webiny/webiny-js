import { HeadlessCmsExportStructure, SanitizedCmsGroup } from "~/export/types";
import { CmsContext } from "~/types";
import { createFiltering } from "./filtering";
import { sanitizeGroup, sanitizeModel } from "./sanitize";

export const createExportStructureContext = (context: CmsContext): HeadlessCmsExportStructure => {
    return async params => {
        const { targets } = params;

        const filter = createFiltering({
            targets,
            // We can add functionality to exclude the code models from the export.
            // Not implemented yet.
            code: true,
            plugins: context.plugins
        });
        /**
         * We need all the groups which:
         * * are accessible by current user
         * * are not private
         * * are included (if targets are provided)
         */
        const groups = (await context.cms.listGroups()).filter(filter.group).map(sanitizeGroup);
        /**
         * We need all the models which:
         * * are accessible by current user
         * * are not private
         * * are included (if targets are provided)
         * * are part of one of the groups we already fetched
         */
        const models = (await context.cms.listModels())
            .filter(model => {
                const group = groups.find(group => group.id === model.group.id);
                if (!group) {
                    return false;
                }
                return filter.model(model);
            })
            .map(model => {
                const group = groups.find(
                    group => group.id === model.group.id
                ) as SanitizedCmsGroup;
                return sanitizeModel(group, model);
            });

        return {
            groups,
            models
        };
    };
};
