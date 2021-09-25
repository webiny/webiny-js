import { CreateStorageOperationsFactory, ENTITIES } from "~/types";
import WebinyError from "@webiny/error";
import { createTable } from "~/definitions/table";
import { createFormEntity } from "~/definitions/form";
import { createSubmissionEntity } from "~/definitions/submission";
import { createSystemEntity } from "~/definitions/system";
import { createSettingsEntity } from "~/definitions/settings";
import { createSystemStorageOperations } from "~/operations/system";
import { createSubmissionStorageOperations } from "~/operations/submission";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createFormStorageOperations } from "~/operations/form";
import { createSystemPlugin } from "~/operations/system/plugin";

const reservedFields = ["PK", "SK", "index", "data"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name) === false) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export const createStorageOperationsFactory: CreateStorageOperationsFactory = params => {
    const { attributes, table: tableName, documentClient, elasticsearch } = params;

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
        form: createFormEntity({
            entityName: ENTITIES.FORM,
            table,
            attributes: attributes[ENTITIES.FORM]
        }),
        submission: createSubmissionEntity({
            entityName: ENTITIES.SUBMISSION,
            table,
            attributes: attributes[ENTITIES.SUBMISSION]
        }),
        system: createSystemEntity({
            entityName: ENTITIES.SYSTEM,
            table,
            attributes: attributes[ENTITIES.SYSTEM]
        }),
        settings: createSettingsEntity({
            entityName: ENTITIES.SETTINGS,
            table,
            attributes: attributes[ENTITIES.SETTINGS]
        })
    };

    return ({ tenant, locale, plugins }) => {
        const systemPlugin = createSystemPlugin({
            elasticsearch
        });

        plugins.register(systemPlugin);

        return {
            getTable: () => table,
            getEntities: () => entities,
            ...createSystemStorageOperations({
                table,
                entity: entities.system,
                tenant
            }),
            ...createSettingsStorageOperations({
                table,
                entity: entities.settings,
                tenant,
                locale
            }),
            ...createFormStorageOperations({
                elasticsearch,
                table,
                entity: entities.form,
                tenant
            }),
            ...createSubmissionStorageOperations({
                elasticsearch,
                table,
                entity: entities.submission,
                tenant
            })
        };
    };
};
