import { PulumiCommandLifecycleEventHookPlugin } from "./PulumiCommandLifecycleEventHookPlugin";

export class BeforeDeployPlugin extends PulumiCommandLifecycleEventHookPlugin {
    public static override readonly type: "hook-before-deploy";
}
