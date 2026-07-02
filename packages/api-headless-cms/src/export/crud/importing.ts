import WebinyError from "@webiny/error";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type {
    HeadlessCmsImport,
    ValidCmsGroupResult,
    ValidCmsModelResult
} from "~/export/types.js";
import type { CmsContext } from "~/types/index.js";
import { importData } from "./imports/importData.js";
import { validateInput } from "./imports/validateInput.js";
import { ListGroupsUseCase } from "~/features/contentModelGroup/ListGroups/index.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";

const fetchGroupsAndModels = async (context: CmsContext) => {
    return await context.container.resolve(IdentityContext).withoutAuthorization(async () => {
        const groupsResult = await context.container.resolve(ListGroupsUseCase).execute();
        if (groupsResult.isFail()) {
            throw groupsResult.error;
        }
        const modelsResult = await context.container.resolve(ListModelsUseCase).execute();
        if (modelsResult.isFail()) {
            throw modelsResult.error;
        }
        return {
            groups: groupsResult.value,
            models: modelsResult.value
        };
    });
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
            const { data } = params;

            const { groups, models } = await fetchGroupsAndModels(context);

            const validated = await validateInput({
                groups,
                models,
                data
            });
            if (validated.error) {
                throw new WebinyError(validated.error, "VALIDATION_ERROR");
            }

            const imported = await importData({
                context,
                groups: validated.groups as ValidCmsGroupResult[],
                models: validated.models as ValidCmsModelResult[]
            });

            const modelError = imported.models.find(model => !!model.error);
            const error = imported.error || modelError;

            return {
                ...imported,
                message: error ? null : "Import done."
            };
        }
    };
};
