import { Table } from "@webiny/db-dynamodb/toolbox";
import pick from "lodash/pick";
import { createLegacyEntity, createStandardEntity } from "~/utils";

export const legacyAttributes: Parameters<typeof createLegacyEntity>[2] = {
    id: {
        type: "string"
    },
    key: {
        type: "string"
    },
    size: {
        type: "number"
    },
    type: {
        type: "string"
    },
    name: {
        type: "string"
    },
    meta: {
        type: "map"
    },
    tags: {
        type: "list"
    },
    createdOn: {
        type: "string"
    },
    createdBy: {
        type: "map"
    },
    tenant: {
        type: "string"
    },
    locale: {
        type: "string"
    },
    webinyVersion: {
        type: "string"
    }
};

export const getFileData = (file: any) => {
    return pick(file, Object.keys(legacyAttributes));
};

export const createLegacyFileEntity = (table: Table<string, string, string>) => {
    return createLegacyEntity(table, "Files", legacyAttributes);
};

export const createFileEntity = (table: Table<string, string, string>) => {
    return createStandardEntity(table, "FM.File");
};
