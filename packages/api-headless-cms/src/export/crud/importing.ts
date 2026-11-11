import WebinyError from "@webiny/error";
import { NotAuthorizedError } from "~/utils/errors.js";
import type {
    HeadlessCmsImport,
    ValidCmsGroupResult,
    ValidCmsModelResult
} from "~/export/types.js";
import type { CmsContext } from "~/types/index.js";
import { importData } from "./imports/importData.js";
import { validateInput } from "./imports/validateInput.js";

const fetchGroupsAndModels = async (context: CmsContext) => {
    return await context.security.withoutAuthorization(async () => {
        return {
            groups: await context.cms.listGroups(),
            models: await context.cms.listModels()
        };
    });
};

/**
 * Validation reads all groups and models, so require the access an import needs before doing
 * anything. Security: without this, the structure import was an existence oracle for groups and
 * models the identity cannot access.
 */
const ensureCanImport = async (context: CmsContext) => {
    const canWriteGroups = await context.cms.accessControl.canAccessGroup({ rwd: "w" });
    const canWriteModels = await context.cms.accessControl.canAccessModel({ rwd: "w" });
    if (!canWriteGroups || !canWriteModels) {
        throw new NotAuthorizedError("Not allowed to import content model groups and models.");
    }
};

export const createImportCrud = (context: CmsContext): HeadlessCmsImport => {
    return {
        validate: async params => {
            const { data } = params;

            await ensureCanImport(context);

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

            await ensureCanImport(context);

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
