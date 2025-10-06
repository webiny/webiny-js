import { createImplementation } from "@webiny/di-container";
import { AdminAfterDeploy } from "~/abstractions/index.js";
import { globalConfig } from "@webiny/global-config";

class TelemetryNoLongerNewUser implements AdminAfterDeploy.Interface {
    async execute() {
        // Mark the user as no longer new.
        globalConfig.set("newUser", false);
    }
}

export default createImplementation({
    abstraction: AdminAfterDeploy,
    implementation: TelemetryNoLongerNewUser,
    dependencies: []
});
