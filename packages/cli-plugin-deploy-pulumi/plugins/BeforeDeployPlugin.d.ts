import { Plugin } from "@webiny/plugins";

export interface BeforeDeployCallable {
    (params: any, context: any): void | Promise<void>;
}

export class BeforeDeployPlugin extends Plugin {
    public static override readonly type: "hook-before-deploy";
    private readonly _callable: BeforeDeployCallable;

    constructor(callable: BeforeDeployCallable);

    public hook(params: any, context: any): void | Promise<void>;
}
