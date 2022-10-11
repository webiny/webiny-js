import WebinyError from "@webiny/error";
import { UpgradePlugin } from "@webiny/api-upgrade";
import { CmsContext, CmsModelField, HeadlessCms } from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NContextObject } from "@webiny/api-i18n/types";

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
/**
 * If at least one field does not have storageId define, we should definitely update the model.
 */
const shouldUpdate = (fields: CmsModelField[]): boolean => {
    return fields.some(field => {
        if (field.settings?.fields) {
            return shouldUpdate(field.settings.fields);
        }
        return !field.storageId;
    });
};

interface UpgradeTenantModelsParams {
    tenant: Tenant;
    cms: HeadlessCms;
    i18n: I18NContextObject;
}

const upgradeTenantModels = async (params: UpgradeTenantModelsParams): Promise<void> => {
    const { tenant, cms, i18n } = params;
    /**
     * We need all locales for this tenant, so we can go and find all models for all the locales.
     */
    const [locales] = await i18n.locales.storageOperations.list({
        where: {
            tenant: tenant.id
        },
        limit: 100
    });
    if (locales.length === 0) {
        console.log(`There are no locales under the tenant "${tenant.id}".`);
        return;
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
            console.log(
                `No models in tenant "${tenant.id}" and locale "${locale.code}" combination.`
            );
            continue;
        }

        /**
         * Then we need to go into each of the model fields and add the storageId, which is the same as the fieldId
         */
        const updatedModels = models
            .filter(model => {
                /**
                 * If model has at least one field with no storageId, continue with the update.
                 */
                const toUpdate = shouldUpdate(model.fields);

                /**
                 * If not updating the model, lets log it - just in case...
                 */
                if (!toUpdate) {
                    console.log(
                        `Skipping update of model "${model.modelId} - ${tenant.id} - ${locale.code}".`
                    );
                    return false;
                }
                return true;
            })
            .map(model => {
                return {
                    ...model,
                    fields: assignStorageId(model.fields)
                };
            });
        /**
         * And update all the models
         */
        for (const model of updatedModels) {
            try {
                await cms.storageOperations.models.update({
                    model
                });
            } catch (ex) {
                throw new WebinyError(
                    `Could not update CMS model ${model.modelId}`,
                    "MODEL_UPGRADE_ERROR",
                    {
                        model
                    }
                );
            }
        }
    }
    /**
     * In the end we need to write the new cms system version.
     */
    await cms.setSystemVersion("5.33.0");
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

            const initialTenant = tenancy.getCurrentTenant();

            const tenants = await tenancy.listTenants();
            try {
                for (const tenant of tenants) {
                    tenancy.setCurrentTenant(tenant);
                    await upgradeTenantModels({
                        tenant,
                        cms,
                        i18n
                    });
                }
            } catch (ex) {
                console.log(
                    `Upgrade error: ${JSON.stringify({
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    })}`
                );
                throw new WebinyError(
                    `Could not finish the 5.33.0 upgrade. Please contact Webiny team on Slack and share the error.`,
                    "UPGRADE_ERROR",
                    {
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    }
                );
            } finally {
                /**
                 * Always enable the security after all the code runs.
                 */
                security.enableAuthorization();
                tenancy.setCurrentTenant(initialTenant);
            }
        }
    };
};
