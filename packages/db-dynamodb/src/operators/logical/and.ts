import { Operator } from "@webiny/db-dynamodb/types";

const processQuery = (query, andArgs, processStatement) => {
    const args = {
        expression: "",
        attributeNames: {},
        attributeValues: {}
    };

    processStatement({ args, query });

    Object.assign(andArgs.attributeNames, args.attributeNames);
    Object.assign(andArgs.attributeValues, args.attributeValues);

    if (andArgs.expression === "") {
        andArgs.expression = args.expression;
    } else {
        andArgs.expression += " and " + args.expression;
    }
};

const and: Operator = {
    canProcess: ({ key }) => {
        return key === "$and";
    },
    process: ({ value, args, processStatement }) => {
        const andArgs = {
            expression: "",
            attributeNames: {},
            attributeValues: {}
        };

        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                processQuery(value[i], andArgs, processStatement);
            }
        } else {
            for (const [andKey, andValue] of Object.entries(value)) {
                processQuery({ [andKey]: andValue }, andArgs, processStatement);
            }
        }

        args.expression += "(" + andArgs.expression + ")";
        Object.assign(args.attributeNames, andArgs.attributeNames);
        Object.assign(args.attributeValues, andArgs.attributeValues);
    }
};

export default and;
