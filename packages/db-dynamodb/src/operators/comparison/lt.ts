import { Operator } from "@webiny/db-dynamodb/types";

const lt: Operator = {
    canProcess: ({ value }) => {
        return value && typeof value["$lt"] !== "undefined";
    },
    process: ({ key, value, args }) => {
        args.expression += `#${key} < :${key}`;
        args.attributeNames[`#${key}`] = key;
        args.attributeValues[`:${key}`] = value["$lt"];
    }
};

export default lt;
