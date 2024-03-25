import { Plugin } from "@webiny/plugins";
import { CliContext, ProjectApplication } from "@webiny/cli/types";

export interface CallableParams {
    inputs: Record<string, any>;
    env: string;
    projectApplication: ProjectApplication;
}

export interface Callable {
    (params: CallableParams, context: CliContext): void | Promise<void>;
}

export class PulumiCommandLifecycleEventHookPlugin extends Plugin {
    public static override readonly type: string;
    private readonly _callable: Callable;

    constructor(callable: Callable);

    public hook(params: CallableParams, context: CliContext): void | Promise<void>;
}
