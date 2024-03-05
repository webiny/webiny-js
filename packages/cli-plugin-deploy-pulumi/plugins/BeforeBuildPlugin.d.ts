import { Plugin } from "@webiny/plugins";

export interface BeforeBuildCallable {
    (params: any, context: any): void | Promise<void>;
}

export class BeforeBuildPlugin extends Plugin {
    public static override readonly type: "hook-before-build";
    private readonly _callable: BeforeBuildCallable;

    constructor(callable: BeforeBuildCallable);

    public hook(params: any, context: any): void | Promise<void>;
}
