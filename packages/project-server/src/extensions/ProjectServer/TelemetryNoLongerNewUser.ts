import { AdminAfterBuild } from "@webiny/project/abstractions/index.js";
import { globalConfig } from "@webiny/global-config";

/**
 * Server hosting-type counterpart to project-aws's `TelemetryNoLongerNewUser`, which hangs off
 * `AdminAfterDeploy`. There is no deploy in the self-hosted hosting type, so without this the flag
 * would never flip and every self-hosted user would be reported as a new user forever, on every
 * event, for the lifetime of that machine's `~/.webiny/config`.
 *
 * A successful admin build is the closest self-hosted equivalent of the AWS milestone: the same app,
 * at the point where the user has a working project. The flag only ever goes one way, so repeated
 * builds are a no-op.
 */
class TelemetryNoLongerNewUserImpl implements AdminAfterBuild.Interface {
    async execute() {
        globalConfig.set("newUser", false);
    }
}

export const TelemetryNoLongerNewUser = AdminAfterBuild.createImplementation({
    implementation: TelemetryNoLongerNewUserImpl,
    dependencies: []
});
