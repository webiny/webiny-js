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

            const cloudtrail = app.addModule(ComplianceCloudtrail);
            const vpcFlowLogs = app.addModule(ComplianceVpcFlowLogs);

            // TODO: Should probably expose these as well.
            app.addModule(ComplianceGuardDuty);
            app.addModule(ComplianceDynamoDbAlarms);
            app.addModule(ComplianceLambdaFunctionsAlarms);

            return {
                cloudtrail,
                vpcFlowLogs
            };
        }
    });
}
