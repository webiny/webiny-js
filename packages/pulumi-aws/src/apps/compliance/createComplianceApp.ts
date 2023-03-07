import { PluginCollection } from "@webiny/plugins/types";
import { createPulumiApp } from "@webiny/pulumi";
import { ComplianceCloudtrail } from "./ComplianceCloudtrail";
import { ComplianceVpcFlowLogs } from "./ComplianceVpcFlowLogs";
import { ComplianceGuardDuty } from "./ComplianceGuardDuty";
import { ComplianceDynamoDbAlarms } from "./ComplianceDynamoDbAlarms";
import { ComplianceLambdaFunctionsAlarms } from "./ComplianceLambdaFunctionsAlarms";

export interface CreateComplianceAppParams {
    plugins?: PluginCollection;
}

const APP_NAME = "compliance";
const APP_PATH = "apps/compliance";

export function createComplianceApp(projectAppParams: CreateComplianceAppParams = {}) {
    return {
        id: "compliance",
        name: "compliance",
        description:
            "This project application is responsible for deploying compliance-related cloud infrastructure resources.",
        pulumi: createPulumiApp({
            name: APP_NAME,
            path: APP_PATH,
            config: projectAppParams,
            program: async ({ addModule }) => {
                const cloudtrail = addModule(ComplianceCloudtrail);
                const vpcFlowLogs = addModule(ComplianceVpcFlowLogs);
                const guardDuty = addModule(ComplianceGuardDuty);
                const dynamoDbAlarms = addModule(ComplianceDynamoDbAlarms);
                const lambdaFunctionsAlarms = addModule(ComplianceLambdaFunctionsAlarms);

                return {
                    cloudtrail,
                    vpcFlowLogs,
                    guardDuty,
                    dynamoDbAlarms,
                    lambdaFunctionsAlarms
                };
            }
        }),
        plugins: []
    };
}
