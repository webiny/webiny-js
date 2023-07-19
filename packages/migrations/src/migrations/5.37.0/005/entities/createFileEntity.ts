import { Table } from "dynamodb-toolbox";
import { createStandardEntity } from "~/utils";

const ddbEsAttributes: Parameters<typeof createStandardEntity>[2] = {
    PK: {
        type: "string",
        partitionKey: true
    },
    SK: {
        type: "string",
        sortKey: true
    },
    index: {
        type: "string"
    },
    data: {
        type: "map"
    }
};

export const createDdbFileEntity = (table: Table) => {
    return createStandardEntity(table, "FM.File");
};

export const createDdbEsFileEntity = (table: Table) => {
    return createStandardEntity(table, "FilesElasticsearch", ddbEsAttributes);
};
