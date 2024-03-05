import { globalConfig } from "@webiny/global-config";
import { AfterDeployPlugin } from "@webiny/cli-plugin-deploy-pulumi/plugins";

export const telemetryNoLongerNewUser = new AfterDeployPlugin((params) => {
    // If for some reason the deployment was skipped, we don't want to mark the user as no longer new.
    if (params.inputs.deploy === false) {
        return;
    }

    // Mark the user as no longer new.
    globalConfig.set("newUser", false);
});
