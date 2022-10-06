import * as aws from "@pulumi/aws";

import { createAppModule } from "@webiny/pulumi";
import { CoreOutput } from "./CoreOutput";

export interface VpcParams {
    enabled: boolean | undefined;
}

export const VpcConfig = createAppModule({
    name: "VpcConfig",
    config(app, params: VpcParams) {
        return app.getModule(CoreOutput).apply(core => {
            const functionVpcConfig: aws.types.input.lambda.FunctionVpcConfig = {
                subnetIds: [],
                securityGroupIds: []
            };

            const enabled = Boolean(params.enabled);

            if (enabled) {
                // If VPC is not manually disabled we extract details from core.
                functionVpcConfig.subnetIds = core.vpcPrivateSubnetIds || [];
                functionVpcConfig.securityGroupIds = core.vpcSecurityGroupIds || [];
            }

            return {
                functionVpcConfig,
                enabled
            };
        });
    }
});
