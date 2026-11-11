import { type GetAppStackOutput } from "~/abstractions/features/GetAppStackOutput.js";
import type { ApiStackOutputService } from "@webiny/project-extensions-aws/abstractions/services/ApiStackOutputService.js";

// TODO: split into this per-app stack outputs.
export interface IDefaultStackOutput extends GetAppStackOutput.StackOutput {
    deploymentId: string;
    region: string;
    dynamoDbTable: string;
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
    cognitoUserPoolPasswordPolicy: ApiStackOutputService.PasswordPolicy;
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
