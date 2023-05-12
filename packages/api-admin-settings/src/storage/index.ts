import WebinyError from "@webiny/error";
import { createSettingsEntity } from "./definitions/settings";
import { createTable } from "./definitions/table";
import { StorageOperationsFactory } from "./types";
import { createSettingsStorageOperations } from "~/storage/operations/settings";

export const createStorageOperations: StorageOperationsFactory = async params => {
    const { table, documentClient } = params;

    if (!documentClient) {
        throw new WebinyError(
            "Missing documentClient in @webiny/api-admin-settings storage operations.",
            "DOCUMENT_CLIENT_ERROR"
        );
    }

    const tableInstance = createTable({
        table,
        documentClient
    });

    const entities = {
        settings: createSettingsEntity({
            entityName: "AdminSettings",
            table: tableInstance
        })
    };

    return {
        getEntities: () => entities,
        getTable: () => tableInstance,
        settings: await createSettingsStorageOperations({
            entity: entities.settings
        })
    };
};
