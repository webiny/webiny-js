import { Operator } from "@webiny/db-dynamodb/types";

const beginsWith: Operator = {
    canProcess: ({ value }) => {
        return value && typeof value["$beginsWith"] !== "undefined";
    },
    process: ({ key, value, args }) => {
        args.expression += `begins_with (#${key}, :${key})`;
        args.attributeNames[`#${key}`] = key;
        args.attributeValues[`:${key}`] = value["$beginsWith"];
    }
};

export default beginsWith;
