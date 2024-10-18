import {
    Callable,
    PulumiCommandLifecycleEventHookPlugin
} from "./PulumiCommandLifecycleEventHookPlugin";

export class BeforeWatchPlugin extends PulumiCommandLifecycleEventHookPlugin {
    public static override readonly type: "hook-before-watch";
}

export function createBeforeWatchPlugin(callable: Callable): BeforeWatchPlugin;
