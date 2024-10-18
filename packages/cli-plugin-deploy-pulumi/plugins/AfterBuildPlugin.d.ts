import {
    Callable,
    PulumiCommandLifecycleEventHookPlugin
} from "./PulumiCommandLifecycleEventHookPlugin";

export class AfterBuildPlugin extends PulumiCommandLifecycleEventHookPlugin {
    public static override readonly type: "hook-after-build";
}

export function createAfterBuildPlugin(callable: Callable): AfterBuildPlugin;
