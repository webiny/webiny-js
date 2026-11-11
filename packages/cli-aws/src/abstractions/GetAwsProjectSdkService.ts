import { createAbstraction } from "@webiny/cli-core/abstractions/createAbstraction.js";
import { type AwsProjectSdk } from "@webiny/project-aws/AwsProjectSdk.js";

export interface IGetAwsProjectSdkService {
    execute(): Promise<AwsProjectSdk>;
}

/** The project SDK with the deploy and Pulumi methods, for the commands that need them. */
export const GetAwsProjectSdkService =
    createAbstraction<IGetAwsProjectSdkService>("GetAwsProjectSdkService");

export namespace GetAwsProjectSdkService {
    export type Interface = IGetAwsProjectSdkService;
}
