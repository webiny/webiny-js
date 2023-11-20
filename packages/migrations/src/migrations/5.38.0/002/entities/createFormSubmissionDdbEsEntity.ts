import { Table } from "@webiny/db-dynamodb/toolbox";
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

export const createFormSubmissionDdbEsEntity = (table: Table<string, string, string>) => {
    return createStandardEntity(table, "FormBuilderSubmissionEs", ddbEsAttributes);
};
