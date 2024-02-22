import { globalConfig } from "@webiny/global-config";

export const telemetryNoLongerNewUser = {
    type: "hook-after-deploy",
    name: "hook-after-deploy-telemetry-no-longer-new-user",
    async hook(params: Record<string, any>) {
        // If for some reason the deployment was skipped, we don't want to mark the user as no longer new.
        if (params.inputs.deploy === false) {
            return;
        }

        // Mark the user as no longer new.
        globalConfig.set("newUser", false);
    }
};
