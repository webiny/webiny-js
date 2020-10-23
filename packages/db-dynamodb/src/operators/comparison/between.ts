import { Operator } from "@webiny/db-dynamodb/types";

const between: Operator = {
    canProcess: ({ value }) => {
        return value && typeof value["$between"] !== "undefined";
    },
    process: ({ key, value }) => {
        return {
            statement: `#${key} BETWEEN :${key}Gte AND :${key}Lte`,
            attributeNames: {
                [`#${key}`]: key
            },
            attributeValues: {
                [`:${key}Gte`]: value[0],
                [`:${key}Lte`]: value[1]
            }
        };
    }
};

export default between;
