import * as aws from "@pulumi/aws";

import { StorageOutput } from "./getStorageOutput";

export function getFunctionVpcConfig(storageOutput: StorageOutput) {
    return storageOutput.apply(output => {
        const vpc: aws.types.input.lambda.FunctionVpcConfig = {
            subnetIds: output.vpcPrivateSubnetIds || [],
            securityGroupIds: output.vpcSecurityGroupIds || []
        };

        return vpc;
    });
}
