/**
 * Whether the tests run against DynamoDB storage. Local runs default to DynamoDB, and CI's DynamoDB
 * groups are "ddb" and "ddb-os,ddb". The SQL group is "sql,ddb", so checking for "ddb" anywhere in
 * the value isn't enough.
 */
export const usesDynamoDb =
    !process.env.WEBINY_STORAGE || process.env.WEBINY_STORAGE.startsWith("ddb");
