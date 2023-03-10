import { Table } from "dynamodb-toolbox";
import pick from "lodash.pick";
import { createLegacyEntity, createStandardEntity } from "~/utils";

const attributes: Parameters<typeof createLegacyEntity>[2] = {
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
    return pick(file, Object.keys(attributes));
};

export const createLegacyFileEntity = (table: Table) => {
    return createLegacyEntity(table, "Files", attributes);
};

export const createFileEntity = (table: Table) => {
    return createStandardEntity(table, "FM.File");
};
