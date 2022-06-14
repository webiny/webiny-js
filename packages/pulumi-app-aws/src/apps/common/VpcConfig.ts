import * as aws from "@pulumi/aws";

import { createAppModule } from "@webiny/pulumi-app";
import { StorageOutput } from "./StorageOutput";

export interface VpcParams {
    enabled: boolean | undefined;
}

export const VpcConfig = createAppModule({
    name: "VpcConfig",
    config(app, params: VpcParams) {
        return app.getModule(StorageOutput).apply(storage => {
            const functionVpcConfig: aws.types.input.lambda.FunctionVpcConfig = {
                subnetIds: [],
                securityGroupIds: []
            };

            const enabled = params.enabled !== false;

            if (enabled) {
                // If VPC is not manually disabled we extract details from storage.
                functionVpcConfig.subnetIds = storage.vpcPrivateSubnetIds || [];
                functionVpcConfig.securityGroupIds = storage.vpcSecurityGroupIds || [];
            }

            return {
                functionVpcConfig,
                enabled
            };
        });
    }
});
