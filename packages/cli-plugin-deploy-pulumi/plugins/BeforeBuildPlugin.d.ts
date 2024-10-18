import {
    Callable,
    PulumiCommandLifecycleEventHookPlugin
} from "./PulumiCommandLifecycleEventHookPlugin";

export class BeforeBuildPlugin extends PulumiCommandLifecycleEventHookPlugin {
    public static override readonly type: "hook-before-build";
}

export function createBeforeBuildPlugin(callable: Callable): BeforeBuildPlugin;
