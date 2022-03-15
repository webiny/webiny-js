/**
 * Remove this when no apps are using our internal db drivers anymore
 */
// @ts-nocheck
import processStatement from "./processStatement";
import { ProcessStatementArgsParam, Query, QueryKey, QuerySort } from "~/types";

interface Output {
    KeyConditionExpression: string;
    ExpressionAttributeNames: Record<string, any>;
    ExpressionAttributeValues: Record<string, any>;
    ScanIndexForward: boolean;
    IndexName: string;
}
interface Params {
    query: Query;
    sort: QuerySort;
    key: QueryKey;
}
export default ({ query, sort, key }: Params): Output => {
    const args: ProcessStatementArgsParam = {
        expression: "",
        attributeNames: {},
        attributeValues: {}
    };

    processStatement({ args, query: { $and: query } });

    const output: Output = {
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
