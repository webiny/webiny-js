import { UpgradePlugin } from "@webiny/api-upgrade";
import WebinyError from "@webiny/error";
import { PageBuilderContextObject, PbContext } from "~/graphql/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NContextObject } from "@webiny/api-i18n/types";
import { IFolders } from "@webiny/api-folders/types";

interface CreatePageLinksParams {
    tenant: Tenant;
    pageBuilder: PageBuilderContextObject;
    folders: IFolders;
    i18n: I18NContextObject;
}

const createPageLinks = async (params: CreatePageLinksParams): Promise<void> => {
    const { tenant, pageBuilder, i18n } = params;
    /**
     * Find all locales for the current tenant, so we can find all pages for each locale.
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
        i18n.setContentLocale(locale);

        const [pages] = await pageBuilder.listLatestPages({ limit: 100 });

        const pageIds = pages.map(page => page.pid);

        console.log(pageIds);
    }
    /**
     * We need all the models that are not plugin models.
     */

    //
    //
    // const models = await cms.storageOperations.models.list({
    //     where: {
    //         tenant: tenant.id,
    //         locale: locale.code
    //     }
    // });
    // if (models.length === 0) {
    //     console.log(
    //         `No models in tenant "${tenant.id}" and locale "${locale.code}" combination.`
    //     );
    //     continue;
    // }
    //
    // /**
    //  * Then we need to go into each of the model fields and add the storageId, which is the same as the fieldId
    //  */
    // const updatedModels = models
    //     .filter(model => {
    //         /**
    //          * If model has at least one field with no storageId, continue with the update.
    //          */
    //         const toUpdate = shouldUpdate(model.fields);
    //
    //         /**
    //          * If not updating the model, lets log it - just in case...
    //          */
    //         if (!toUpdate) {
    //             console.log(
    //                 `Skipping update of model "${model.modelId} - ${tenant.id} - ${locale.code}".`
    //             );
    //             return false;
    //         }
    //         return true;
    //     })
    //     .map(model => {
    //         return {
    //             ...model,
    //             fields: assignStorageId(model.fields)
    //         };
    //     });
    // /**
    //  * And update all the models
    //  */
    // for (const model of updatedModels) {
    //     try {
    //         await cms.storageOperations.models.update({
    //             model
    //         });
    //     } catch (ex) {
    //         throw new WebinyError(
    //             `Could not update CMS model ${model.modelId}`,
    //             "MODEL_UPGRADE_ERROR",
    //             {
    //                 model
    //             }
    //         );
    //     }
    // }
};

export const createUpgrade = (): UpgradePlugin<PbContext> => {
    return {
        type: "api-upgrade",
        version: "5.34.0",
        app: "page-builder",
        apply: async context => {
            const { security, tenancy, i18n, pageBuilder, folders } = context;

            /**
             * We need to be able to access all data.
             */
            security.disableAuthorization();

            const initialTenant = tenancy.getCurrentTenant();

            try {
                const tenants = await tenancy.listTenants();
                for (const tenant of tenants) {
                    tenancy.setCurrentTenant(tenant);
                    await createPageLinks({
                        tenant,
                        i18n,
                        pageBuilder,
                        folders
                    });
                }
            } catch (e) {
                console.log(
                    `Upgrade error: ${JSON.stringify({
                        message: e.message,
                        code: e.code,
                        data: e.data
                    })}`
                );
                throw new WebinyError(
                    `Could not finish the 5.34.0 upgrade. Please contact Webiny team on Slack and share the error.`,
                    "UPGRADE_ERROR",
                    {
                        message: e.message,
                        code: e.code,
                        data: e.data
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
        //     const { security, tenancy, cms, i18n } = context;
        //
        //     /**
        //      * We need to be able to access all data.
        //      */
        //     security.disableAuthorization();
        //
        //     const initialTenant = tenancy.getCurrentTenant();
        //
        //     const tenants = await tenancy.listTenants();
        //     try {
        //         for (const tenant of tenants) {
        //             tenancy.setCurrentTenant(tenant);
        //             await upgradeTenantModels({
        //                 tenant,
        //                 cms,
        //                 i18n
        //             });
        //         }
        //     } catch (ex) {
        //         console.log(
        //             `Upgrade error: ${JSON.stringify({
        //                 message: ex.message,
        //                 code: ex.code,
        //                 data: ex.data
        //             })}`
        //         );
        //         throw new WebinyError(
        //             `Could not finish the 5.33.0 upgrade. Please contact Webiny team on Slack and share the error.`,
        //             "UPGRADE_ERROR",
        //             {
        //                 message: ex.message,
        //                 code: ex.code,
        //                 data: ex.data
        //             }
        //         );
        //     } finally {
        //         /**
        //          * Always enable the security after all the code runs.
        //          */
        //         security.enableAuthorization();
        //         tenancy.setCurrentTenant(initialTenant);
        //     }
        // }
    };
};
