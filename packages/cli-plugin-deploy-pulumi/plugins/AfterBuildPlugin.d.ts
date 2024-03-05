import { Plugin } from "@webiny/plugins";

export interface AfterBuildCallable {
    (params: any, context: any): void | Promise<void>;
}

export class AfterBuildPlugin extends Plugin {
    public static override readonly type: "hook-after-build";
    private readonly _callable: AfterBuildCallable;

    constructor(callable: AfterBuildCallable);

    public hook(params: any, context: any): void | Promise<void>;
}
