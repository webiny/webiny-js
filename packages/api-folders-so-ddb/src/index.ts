import { createLinksStorageOperations } from "~/operations/links";
import { createFoldersStorageOperations } from "~/operations/folders";

import { ENTITIES, StorageParams } from "./types";
import { StorageOperations } from "@webiny/api-folders/types";
import WebinyError from "@webiny/error";
import { createTable } from "~/definitions/table";
import { createEntity } from "~/definitions/entities";

const reservedFields: string[] = ["PK", "SK", "index", "data"];

const isReserved = (name: string): void => {
    if (!reservedFields.includes(name)) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export const createStorageOperations = (params: StorageParams): StorageOperations => {
    const { table: tableName, documentClient, attributes } = params;

    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const table = createTable({ table: tableName, documentClient });

    const entities = {
        folders: createEntity(
            ENTITIES.FOLDER,
            table,
            attributes ? attributes[ENTITIES.FOLDER] : {}
        ),
        links: createEntity(ENTITIES.LINK, table, attributes ? attributes[ENTITIES.LINK] : {})
    };

    return {
        ...createLinksStorageOperations(entities.links),
        ...createFoldersStorageOperations(entities.folders, table)
    };
};
