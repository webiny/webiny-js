import {
    Callable,
    PulumiCommandLifecycleEventHookPlugin
} from "./PulumiCommandLifecycleEventHookPlugin";

export class BeforeDeployPlugin extends PulumiCommandLifecycleEventHookPlugin {
    public static override readonly type: "hook-before-deploy";
}

export function createBeforeDeployPlugin(callable: Callable): BeforeDeployPlugin;
