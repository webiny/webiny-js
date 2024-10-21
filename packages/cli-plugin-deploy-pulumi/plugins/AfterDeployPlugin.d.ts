import {
    Callable,
    PulumiCommandLifecycleEventHookPlugin
} from "./PulumiCommandLifecycleEventHookPlugin";

export class AfterDeployPlugin extends PulumiCommandLifecycleEventHookPlugin {
    public static override readonly type: "hook-after-deploy";
}

export function createAfterDeployPlugin(callable: Callable): AfterDeployPlugin;
