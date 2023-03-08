import { createPulumiApp, PulumiAppParam } from "@webiny/pulumi";
import { ComplianceCloudtrail } from "./compliance/ComplianceCloudtrail";
import { ComplianceVpcFlowLogs } from "./compliance/ComplianceVpcFlowLogs";
import { ComplianceGuardDuty } from "./compliance/ComplianceGuardDuty";
import { ComplianceDynamoDbAlarms } from "./compliance/ComplianceDynamoDbAlarms";
import { ComplianceLambdaFunctionsAlarms } from "./compliance/ComplianceLambdaFunctionsAlarms";
import { CoreOutput } from "~/apps";

export interface CreateCompliancePulumiAppParams {
    /**
     * Prefixes names of all Pulumi cloud infrastructure resource with given prefix.
     */
    pulumiResourceNamePrefix?: PulumiAppParam<string>;

    /**
     * Secure Standardized Logging Service - AWS CloudTrail
     * https://aws.amazon.com/cloudtrail
     */
    cloudtrail?: PulumiAppParam<boolean>;

    /**
     * Logging IP traffic using VPC Flow Logs
     * https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html
     */
    vpcFlowLogs?: PulumiAppParam<boolean>;

    /**
     * Amazon GuardDuty - Intelligent threat detection
     * https://aws.amazon.com/guardduty/
     */
    guardDuty?: PulumiAppParam<boolean>;

    /**
     * Creating CloudWatch alarms to monitor DynamoDB
     * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/creating-alarms.html
     */
    dynamoDbAlarms?: PulumiAppParam<boolean>;

    /**
     * AWS Lambda CloudWatch alarms
     * https://docs.aws.amazon.com/lambda/latest/operatorguide/important-metrics.html
     */
    lambdaFunctionsAlarms?: PulumiAppParam<boolean>;
}

const APP_NAME = "compliance";
const APP_PATH = "apps/compliance";

export function createCompliancePulumiApp(projectAppParams: CreateCompliancePulumiAppParams = {}) {
    return createPulumiApp({
        name: APP_NAME,
        path: APP_PATH,
        config: projectAppParams,
        program: async app => {
            // Register core output as a module available to all the other modules
            app.addModule(CoreOutput);

            const pulumiResourceNamePrefix = app.getParam(
                projectAppParams.pulumiResourceNamePrefix
            );
            if (pulumiResourceNamePrefix) {
                app.onResource(resource => {
                    if (!resource.name.startsWith(pulumiResourceNamePrefix)) {
                        resource.name = `${pulumiResourceNamePrefix}${resource.name}`;
                    }
                });
            }

            const useCloudtrail = app.getParam(projectAppParams.cloudtrail);
            const useVpcFlowLogs = app.getParam(projectAppParams.vpcFlowLogs);
            const useGuardDuty = app.getParam(projectAppParams.guardDuty);
            const useDynamoDbAlarms = app.getParam(projectAppParams.dynamoDbAlarms);
            const useLambdaFunctionsAlarms = app.getParam(projectAppParams.lambdaFunctionsAlarms);

            let cloudtrail, vpcFlowLogs, guardDuty, dynamoDbAlarms, lambdaFunctionsAlarms;

            if (useCloudtrail === true) {
                cloudtrail = app.addModule(ComplianceCloudtrail);
            }

            if (useVpcFlowLogs === true) {
                vpcFlowLogs = app.addModule(ComplianceVpcFlowLogs);
            }

            if (useGuardDuty === true) {
                guardDuty = app.addModule(ComplianceGuardDuty);
            }

            if (useDynamoDbAlarms === true) {
                dynamoDbAlarms = app.addModule(ComplianceDynamoDbAlarms);
            }

            if (useLambdaFunctionsAlarms === true) {
                lambdaFunctionsAlarms = app.addModule(ComplianceLambdaFunctionsAlarms);
            }

            return {
                cloudtrail,
                vpcFlowLogs,
                guardDuty,
                dynamoDbAlarms,
                lambdaFunctionsAlarms
            };
        }
    });
}
