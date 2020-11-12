import { Operator } from "@webiny/db-dynamodb/types";

const gt: Operator = {
    canProcess: ({ value }) => {
        return value && typeof value["$gt"] !== "undefined";
    },
    process: ({ key, value, args }) => {
        args.expression += `#${key} > :${key}`;
        args.attributeNames[`#${key}`] = key;
        args.attributeValues[`:${key}`] = value["$gt"];
    }
};

export default gt;
