import { PulumiCommandLifecycleEventHookPlugin } from "./PulumiCommandLifecycleEventHookPlugin";

export class AfterDeployPlugin extends PulumiCommandLifecycleEventHookPlugin {
    public static override readonly type: "hook-after-deploy";
}
