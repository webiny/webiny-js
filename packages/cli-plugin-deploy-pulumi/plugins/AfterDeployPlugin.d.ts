import { Plugin } from "@webiny/plugins";

export interface AfterDeployCallable {
    (params: any, context: any): void | Promise<void>;
}

export class AfterDeployPlugin extends Plugin {
    public static override readonly type: "hook-after-deploy";
    private readonly _callable: AfterDeployCallable;

    constructor(callable: AfterDeployCallable);

    public hook(params: any, context: any): void | Promise<void>;
}
