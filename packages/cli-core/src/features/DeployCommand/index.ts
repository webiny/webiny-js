import { AppName } from "@webiny/project";

// Abstract contract for the deploy command.
// The concrete implementation lives in @webiny/cli-aws.
export interface IDeployCommandParams {
    apps?: AppName[];
    variant?: string;
    region?: string;
    env: string;
    showDeploymentLogs?: boolean;
    build?: boolean;
    preview?: boolean;
    allowLocalStateFiles?: boolean;
}

export interface IDeploySingleAppParams {
    app: AppName;
    variant?: string;
    region?: string;
    env: string;
    showDeploymentLogs?: boolean;
    build?: boolean;
    preview?: boolean;
}
