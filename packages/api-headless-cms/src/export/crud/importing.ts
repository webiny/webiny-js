import { HeadlessCmsImport, ValidCmsGroupResult, ValidCmsModelResult } from "~/export/types";
import { CmsContext } from "~/types";
import { importData } from "./imports/importData";
import { validateInput } from "./imports/validateInput";

const fetchGroupsAndModels = async (context: CmsContext) => {
    const groups = await context.security.withoutAuthorization(async () => {
        return await context.cms.listGroups();
    });
    const models = await context.security.withoutAuthorization(async () => {
        return await context.cms.listModels();
    });
    return {
        groups,
        models
    };
};

export const createImportCrud = (context: CmsContext): HeadlessCmsImport => {
    return {
        validate: async params => {
            const { data } = params;

            const { groups, models } = await fetchGroupsAndModels(context);

            const validated = await validateInput({
                groups,
                models,
                data
            });
            if (validated.error) {
                return {
                    groups: validated.groups,
                    models: validated.models,
                    message: validated.error
                };
            }

            return {
                groups: validated.groups,
                models: validated.models,
                message: "Validation done."
            };
        },
        structure: async params => {
            const { data, models: importModelsList } = params;

            const { groups, models } = await fetchGroupsAndModels(context);

            const validated = await validateInput({
                groups,
                models,
                data
            });
            if (validated.error) {
                return {
                    groups: validated.groups.map(result => {
                        return {
                            ...result,
                            imported: false
                        };
                    }),
                    models: validated.models.map(result => {
                        return {
                            ...result,
                            imported: false
                        };
                    }),
                    message: null,
                    error: validated.error
                };
            }

            const imported = await importData({
                context,
                groups: validated.groups as ValidCmsGroupResult[],
                models: (validated.models as ValidCmsModelResult[]).filter(model => {
                    if (!model.model.modelId) {
                        return false;
                    }
                    return importModelsList.includes(model.model.modelId);
                })
            });

            return {
                ...imported,
                message: imported.error ? null : "Import done."
            };
        }
    };
};
