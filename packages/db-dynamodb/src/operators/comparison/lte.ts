import { Operator } from "@webiny/db-dynamodb/types";

const lte: Operator = {
    canProcess: ({ value }) => {
        return value && typeof value["$lte"] !== "undefined";
    },
    process: ({ key, value, args }) => {
        args.expression += `#${key} <= :${key}`;
        args.attributeNames[`#${key}`] = key;
        args.attributeValues[`:${key}`] = value["$lte"];
    }
};

export default lte;
