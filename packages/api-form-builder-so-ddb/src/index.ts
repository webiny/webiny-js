import WebinyError from "@webiny/error";
import { FormBuilderStorageOperationsFactory, ENTITIES } from "~/types";
import { createTable } from "~/definitions/table";
import { createSystemEntity } from "~/definitions/system";
import { createSettingsEntity } from "~/definitions/settings";
import { createSystemStorageOperations } from "~/operations/system";
import { createSubmissionStorageOperations } from "~/operations/submission";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createFormStorageOperations } from "~/operations/form";
import { createFormStatsStorageOperations } from "~/operations/formStats";

const reservedFields = ["PK", "SK", "index", "data", "TYPE", "__type", "GSI1_PK", "GSI1_SK"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name) === false) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export * from "./plugins";

export const createFormBuilderStorageOperations: FormBuilderStorageOperationsFactory = params => {
    const { attributes, table: tableName, documentClient } = params;

    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const table = createTable({
        tableName,
        documentClient
    });

    const entities = {
        /**
         * Regular entities.
         */
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
        forms: createFormStorageOperations(),
        formStats: createFormStatsStorageOperations(),
        submissions: createSubmissionStorageOperations()
    };
};
