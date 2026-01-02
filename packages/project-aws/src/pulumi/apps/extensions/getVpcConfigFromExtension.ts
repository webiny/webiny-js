import { Vpc as vpcExt } from "~/pulumi/extensions/Vpc.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

export const getVpcConfigFromExtension = (projectConfig: IProjectConfigModel) => {
    const [vpcExtension] = projectConfig.extensionsByType(vpcExt);
    if (!vpcExtension) {
        // VPC automatically used with production environments.
        return undefined;
    }

    const { enabled, useVpcEndpoints, useExistingVpc } = vpcExtension.params;
    if (enabled === false) {
        return false;
    }

    if (useVpcEndpoints || useExistingVpc) {
        const vpc: Omit<typeof vpcExtension.params, "enabled"> = {};

        if (useVpcEndpoints) {
            vpc.useVpcEndpoints = useVpcEndpoints;
        }

        if (useExistingVpc) {
            vpc.useExistingVpc = useExistingVpc;
        }

        return vpc;
    }

    return true;
};
