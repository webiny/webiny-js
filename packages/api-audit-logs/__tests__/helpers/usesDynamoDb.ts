/**
 * Whether the tests run against DynamoDB storage. Local runs default to DynamoDB, and CI's DynamoDB
 * setups are "ddb" and "ddb-os,ddb".
 */
export const usesDynamoDb =
    !process.env.WEBINY_STORAGE || process.env.WEBINY_STORAGE.startsWith("ddb");
