import { createAppModule, type PulumiAppModule } from "@webiny/pulumi";
import { ProjectSdk } from "@webiny/project";

export type CoreOutput = PulumiAppModule<typeof CoreOutput>;

export interface ICoreOutput {
    deploymentId: string;
    region: string;
    dynamoDbTable: string;
    iotAuthorizerName: string;
    cognitoUserPoolArn: string;
    cognitoAppClientId: string;
    cognitoUserPoolId: string;
    cognitoUserPoolPasswordPolicy: string;
    fileManagerBucketId: string;
    fileManagerBucketArn: string;
    primaryDynamodbTableArn: string;
    primaryDynamodbTableName: string;
    primaryDynamodbTableHashKey: string;
    primaryDynamodbTableRangeKey: string;
    auditLogsDynamodbTableArn: string;
    auditLogsDynamodbTableName: string;
    auditLogsDynamodbTableHashKey: string;
    auditLogsDynamodbTableRangeKey: string;
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
}

export const CoreOutput = createAppModule({
    name: "CoreOutput",
    config(app) {
        return app.addHandler(async () => {
            const sdk = await ProjectSdk.init();

            const output = await sdk.getAppStackOutput("core");
            if (!output) {
                throw new Error("Core application is not deployed.");
            }

            return {
                fileManagerBucketId: output["fileManagerBucketId"],
                primaryDynamodbTableArn: output["primaryDynamodbTableArn"],
                primaryDynamodbTableName: output["primaryDynamodbTableName"],
                primaryDynamodbTableHashKey: output["primaryDynamodbTableHashKey"],
                primaryDynamodbTableRangeKey: output["primaryDynamodbTableRangeKey"],
                auditLogsDynamodbTableArn: output["auditLogsDynamodbTableArn"],
                auditLogsDynamodbTableName: output["auditLogsDynamodbTableName"],
                auditLogsDynamodbTableHashKey: output["auditLogsDynamodbTableHashKey"],
                auditLogsDynamodbTableRangeKey: output["auditLogsDynamodbTableRangeKey"],
                cognitoUserPoolId: output["cognitoUserPoolId"],
                cognitoUserPoolArn: output["cognitoUserPoolArn"],
                cognitoUserPoolPasswordPolicy: output["cognitoUserPoolPasswordPolicy"],
                cognitoAppClientId: output["cognitoAppClientId"],
                eventBusName: output["eventBusName"],
                eventBusArn: output["eventBusArn"],
                // These outputs are optional, since VPC is not always enabled.
                vpcPublicSubnetIds: output["vpcPublicSubnetIds"],
                vpcPrivateSubnetIds: output["vpcPrivateSubnetIds"],
                vpcSecurityGroupIds: output["vpcSecurityGroupIds"],
                // These outputs are optional, since Opensearch is not always enabled.
                opensearchDomainArn: output["opensearchDomainArn"],
                opensearchDomainEndpoint: output["opensearchDomainEndpoint"],
                opensearchDynamodbTableArn: output["opensearchDynamodbTableArn"],
                opensearchDynamodbTableName: output["opensearchDynamodbTableName"]
            } as ICoreOutput;
        });
    }
});
