import { AdminAfterDeploy } from "~/abstractions/index.js";
import { globalConfig } from "@webiny/global-config";

class TelemetryNoLongerNewUserImpl implements AdminAfterDeploy.Interface {
    async execute() {
        // Mark the user as no longer new.
        globalConfig.set("newUser", false);
    }
}

export const TelemetryNoLongerNewUser = AdminAfterDeploy.createImplementation({
    implementation: TelemetryNoLongerNewUserImpl,
    dependencies: []
});
