import { type IStackOutput } from "@webiny/project";

// TODO: split into this per-app stack outputs.
export interface IDefaultStackOutput extends IStackOutput {
    deploymentId: string;
    region: string;
    dynamoDbTable: string;
    migrationLambdaArn: string;
    iotAuthorizerName: string;
    apiDomain: string;
    apiUrl: string;
    graphqlLambdaRole: string;
    graphqlLambdaRoleName: string;
    fileManagerManageLambdaArn: string;
    fileManagerManageLambdaRole: string;
    fileManagerManageLambdaRoleName: string;
    cognitoUserPoolArn: string;
    cognitoAppClientId: string;
    cognitoUserPoolId: string;
    cognitoUserPoolPasswordPolicy: string;
    websocketApiUrl: string;
    fileManagerBucketId: string;
    fileManagerBucketArn: string;
    primaryDynamodbTableArn: string;
    primaryDynamodbTableName: string;
    primaryDynamodbTableHashKey: string;
    primaryDynamodbTableRangeKey: string;
    eventBusName: string;
    eventBusArn: string;
    vpcPublicSubnetIds: string[] | undefined;
    vpcPrivateSubnetIds: string[] | undefined;
    vpcSecurityGroupIds: string[] | undefined;
    opensearchDomainArn: string | undefined;
    opensearchDomainEndpoint: string | undefined;
    opensearchDynamodbTableHashKey: string;
    opensearchDynamodbTableRangeKey: string;
    opensearchDynamodbTableArn: string | undefined;
    opensearchDynamodbTableName: string | undefined;
    appStorage: string;
    appDomain?: string;
    deliveryDomain?: string;
}
