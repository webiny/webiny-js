export interface ISyncSystemDeploymentInfo {
    name: string;
    env: string;
    variant: string | undefined;
    version: string;
    region: string;
    s3Id: string;
    s3Arn: string;
    primaryDynamoDbArn: string;
    primaryDynamoDbName: string;
    primaryDynamoDbHashKey: string;
    primaryDynamoDbRangeKey: string;
    elasticsearchDynamodbTableArn: string | undefined;
    elasticsearchDynamodbTableName: string | undefined;
    logDynamodbTableArn: string;
    logDynamodbTableName: string;
    cognitoUserPoolId: string;
}
