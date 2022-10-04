import WebinyError from "@webiny/error";
import { UpgradePlugin } from "@webiny/api-upgrade";
import { CmsContext, CmsModelField } from "~/types";

// const clearStorageId = (fields: CmsModelField[]): CmsModelField[] => {
//     return fields.map(field => {
//         const settings = {
//             ...(field.settings || {})
//         };
//         if (settings.fields && Array.isArray(settings.fields) === true) {
//             settings.fields = clearStorageId(settings.fields);
//         }
//         return {
//             ...field,
//             storageId: null as any,
//             settings
//         };
//     });
// };

const assignStorageId = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.map(field => {
        const settings = {
            ...(field.settings || {})
        };
        if (settings.fields && Array.isArray(settings.fields) === true) {
            settings.fields = assignStorageId(settings.fields);
        }
        return {
            ...field,
            storageId: field.fieldId,
            settings
        };
    });
};

export const createUpgrade = (): UpgradePlugin<CmsContext> => {
    return {
        type: "api-upgrade",
        version: "5.33.0",
        app: "headless-cms",
        apply: async context => {
            const { security, tenancy, cms, i18n } = context;

            /**
             * We need to be able to access all data.
             */
            security.disableAuthorization();
            try {
                const tenant = tenancy.getCurrentTenant();
                /**
                 * We need all locales for this tenant, so we can go and find all models for all the locales.
                 */
                const [locales] = await i18n.locales.listLocales();
                if (locales.length === 0) {
                    throw new WebinyError(
                        "There are no locales in the system. Is that possible? Please contact the Webiny team.",
                        "MISSING_LOCALES",
                        {
                            tenant
                        }
                    );
                }
                for (const locale of locales) {
                    /**
                     * We need all the models that are not plugin models.
                     */
                    const models = await cms.storageOperations.models.list({
                        where: {
                            tenant: tenant.id,
                            locale: locale.code
                        }
                    });
                    if (models.length === 0) {
                        continue;
                    }

                    /**
                     * Then we need to go into each of the model fields and add the storageId, which is the same as the fieldId
                     */
                    const updatedModels = models.map(model => {
                        return {
                            ...model,
                            fields: assignStorageId(model.fields)
                        };
                    });
                    /**
                     * And update all the models
                     */
                    for (const model of updatedModels) {
                        await cms.storageOperations.models.update({
                            model
                        });
                    }
                }
            } catch (ex) {
                throw new WebinyError(
                    `Could not finish the 5.33.0 upgrade. Please contact Webiny team on Slack and share the error.`,
                    "UPGRADE_ERROR",
                    {
                        ex: {
                            message: ex.message,
                            code: ex.code,
                            data: ex.data
                        }
                    }
                );
            } finally {
                /**
                 * Always enable the security after all the code runs.
                 */
                security.enableAuthorization();
            }
        }
    };
};
