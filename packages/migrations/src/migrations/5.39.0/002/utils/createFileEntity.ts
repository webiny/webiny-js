import { Table } from "@webiny/db-dynamodb/toolbox";
import { createLegacyEntity } from "~/utils";

const ddbAttributes: Parameters<typeof createLegacyEntity>[2] = {
    PK: {
        type: "string",
        partitionKey: true
    },
    SK: {
        type: "string",
        sortKey: true
    },
    GSI1_PK: {
        type: "string"
    },
    GSI1_SK: {
        type: "string"
    },
    TYPE: {
        type: "string"
    },
    __type: {
        type: "string"
    },
    tenant: {
        type: "string"
    },
    locale: {
        type: "string"
    },
    entryId: {
        type: "string"
    },
    id: {
        type: "string"
    },
    values: {
        type: "map"
    }
};

export interface FileEntry {
    id: string;
    entryId: string;
    tenant: string;
    locale: string;
    values: {
        "text@key": string;
        "number@size": number;
        "text@type": string;
    };
}

export const createFileEntity = (table: Table<string, string, string>) => {
    return createLegacyEntity(table, "CmsEntries", ddbAttributes);
};
