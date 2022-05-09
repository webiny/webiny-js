import { FormBuilderStorageOperationsFactory, ENTITIES } from "~/types";
import { createTable } from "~/definitions/table";
import { createFormEntity } from "~/definitions/form";
import { createSubmissionEntity } from "~/definitions/submission";
import { createSystemEntity } from "~/definitions/system";
import { createSettingsEntity } from "~/definitions/settings";
import { createSystemStorageOperations } from "~/operations/system";
import { createSubmissionStorageOperations } from "~/operations/submission";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createFormStorageOperations } from "~/operations/form";
import { PluginsContainer } from "@webiny/plugins";
import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import formSubmissionFields from "~/operations/submission/fields";
import formFields from "~/operations/form/fields";
import WebinyError from "@webiny/error";

const reservedFields = ["PK", "SK", "index", "data", "TYPE", "__type", "GSI1_PK", "GSI1_SK"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name) === false) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export const createFormBuilderStorageOperations: FormBuilderStorageOperationsFactory = params => {
    const { attributes, table: tableName, documentClient, plugins: userPlugins } = params;

    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const plugins = new PluginsContainer([
        /**
         * User defined plugins.
         */
        userPlugins || [],
        /**
         * Form submission DynamoDB fields.
         */
        formSubmissionFields(),
        /**
         * Form DynamoDB fields.
         */
        formFields(),

        /**
         * DynamoDB filter plugins for the where conditions.
         */
        dynamoDbValueFilters()
    ]);

    const table = createTable({
        tableName,
        documentClient
    });

    const entities = {
        /**
         * Regular entities.
         */
        form: createFormEntity({
            entityName: ENTITIES.FORM,
            table,
            attributes: attributes ? attributes[ENTITIES.FORM] : {}
        }),
        submission: createSubmissionEntity({
            entityName: ENTITIES.SUBMISSION,
            table,
            attributes: attributes ? attributes[ENTITIES.SUBMISSION] : {}
        }),
        system: createSystemEntity({
            entityName: ENTITIES.SYSTEM,
            table,
            attributes: attributes ? attributes[ENTITIES.SYSTEM] : {}
        }),
        settings: createSettingsEntity({
            entityName: ENTITIES.SETTINGS,
            table,
            attributes: attributes ? attributes[ENTITIES.SETTINGS] : {}
        })
    };

    return {
        upgrade: null,
        getTable: () => table,
        getEntities: () => entities,
        ...createSystemStorageOperations({
            table,
            entity: entities.system
        }),
        ...createSettingsStorageOperations({
            table,
            entity: entities.settings
        }),
        ...createFormStorageOperations({
            table,
            entity: entities.form,
            plugins
        }),
        ...createSubmissionStorageOperations({
            table,
            entity: entities.submission,
            plugins
        })
    };
};
