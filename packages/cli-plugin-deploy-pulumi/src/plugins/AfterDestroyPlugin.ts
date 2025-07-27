import {
    Callable,
    PulumiCommandLifecycleEventHookPlugin
} from "./PulumiCommandLifecycleEventHookPlugin";

export class AfterDestroyPlugin extends PulumiCommandLifecycleEventHookPlugin {
    public static override type = "hook-after-destroy";
}

export const createAfterDestroyPlugin = (callable: Callable) => {
    return new AfterDestroyPlugin(callable);
};
