import { Entity, Table } from "@webiny/db-dynamodb/toolbox";

export const createStandardEntity = ({
    table,
    name
}: {
    table: Table<string, string, string>;
    name: string;
}) => {
    return new Entity({
        name,
        table,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
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
            data: {
                type: "map"
            }
        }
    });
};
