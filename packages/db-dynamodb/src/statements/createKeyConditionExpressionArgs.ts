import processStatement from "./processStatement";

export default ({ query, sort, key }) => {
    const args = {
        expression: "",
        attributeNames: {},
        attributeValues: {}
    };

    processStatement({ args, query: { $and: query } });

    const output = {
        KeyConditionExpression: args.expression,
        ExpressionAttributeNames: args.attributeNames,
        ExpressionAttributeValues: args.attributeValues,
        ScanIndexForward: true,
        IndexName: null
    };

    const sortKey = key.fields && key.fields[1];
    if (sort && sort[sortKey.name] === -1) {
        output.ScanIndexForward = false;
    }

    if (!key.primary) {
        output.IndexName = key.name;
    }

    return output;
};
