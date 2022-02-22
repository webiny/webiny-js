/**
 * Not used anymore.
 */
// @ts-nocheck
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { FormBuilderContext } from "@webiny/api-form-builder/types";
import { FormBuilderStorageOperations } from "~/types";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { parseIdentifier } from "@webiny/utils";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import WebinyError from "@webiny/error";

interface Params {
    storageOperations: FormBuilderStorageOperations;
    tenant: Tenant;
    locale: I18NLocale;
    webinyVersion: string;
}

const upgradeForms = async (params: Params): Promise<void> => {
    const { storageOperations, tenant, locale, webinyVersion } = params;
    /**
     * We need all of the forms from the database.
     * We are getting them from the Elasticsearch because there is no general PK for the forms.
     */
    let forms: any[] = [];
    try {
        const { items } = await storageOperations.listForms({
            where: {
                latest: true,
                tenant: tenant.id,
                locale: locale.code
            },
            after: null,
            limit: 10000,
            sort: ["createdOn_DESC"]
        });
        forms = items;
    } catch (ex) {
        console.log("Upgrade forms 5.16.0");
        console.log(ex.message);
        return;
    }

    if (forms.length === 0) {
        return;
    }

    const entity = storageOperations.getEntities().form;
    const items: any[] = [];
    /**
     * ## Regular DynamoDB table.
     * We need to get all the records from all of the forms.
     * Unfortunately, we need to query in a loop to be able to get those forms.
     */
    for (const form of forms) {
        const { id: formId } = parseIdentifier(form.id);

        const formRecords: any[] = await queryAll({
            entity,
            partitionKey: storageOperations.createFormPartitionKey({
                id: form.id,
                tenant: tenant.id,
                locale: locale.code
            })
        });

        for (const record of formRecords) {
            /**
             * Checks for "just in case".
             */
            if (!record || !record.PK || !record.SK) {
                continue;
            }
            items.push(
                entity.putBatch({
                    ...record,
                    formId,
                    webinyVersion
                })
            );
        }
    }
    /**
     * And finally write all the records to the database again.
     */
    try {
        await batchWriteAll({
            table: entity.table,
            items
        });
    } catch (ex) {
        throw new WebinyError("Could not update all form records.", "UPGRADE_FORM_RECORDS_ERROR", {
            error: ex
        });
    }
    /**
     * ## Elasticsearch DynamoDB table.
     */
};
/**
 * This upgrade adds:
 * - formId (first part of the id) and webinyVersion to the form records
 */
export default (): UpgradePlugin<FormBuilderContext> => {
    return {
        type: "api-upgrade",
        app: "form-builder",
        version: "5.16.0",
        apply: async context => {
            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18nContent.getCurrentLocale();
            const storageOperations = context.formBuilder
                .storageOperations as FormBuilderStorageOperations;

            await upgradeForms({
                storageOperations,
                tenant,
                locale,
                webinyVersion: context.WEBINY_VERSION
            });
        }
    };
};
