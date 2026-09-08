import React from "react";
import { Api, Admin } from "@webiny/project-aws";
import { FeatureFlag } from "@webiny/project";

/**
 * Report a bug by talking to the app.
 *
 * Internal. The `bugReporter` feature flag gates this at COMPOSITION time, so with the flag off
 * neither extension is registered and nothing reaches either bundle — there is no dead UI to hide
 * and no runtime flag check to plumb through `toDto()`.
 *
 * `CanUseExplicitly`, not `CanUse`: an unset flag has to mean OFF here. `CanUse` resolves an unset
 * flag to ON for licensed projects, because the license decorator reads anything outside its
 * LICENSE_CHECKS as `!isExplicitlyDisabled` — which would hand this to every existing customer on
 * upgrade. `bugReporter: true` in the project config is the only way in.
 */
export const BugReporter = () => {
    return (
        <FeatureFlag.CanUseExplicitly name={"bugReporter"}>
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />

            {/* All optional. Without a token the API returns a prefilled GitHub URL instead
                of filing, which needs no credentials. Read at build time, so CI can hold
                them as secrets. */}
            <Api.BuildParam
                paramName={"BUG_REPORT_GITHUB_TOKEN"}
                value={process.env.BUG_REPORT_GITHUB_TOKEN || ""}
            />
            <Api.BuildParam
                paramName={"BUG_REPORT_REPOSITORY"}
                value={process.env.BUG_REPORT_REPOSITORY || "webiny/webiny-js"}
            />
            <Api.BuildParam
                paramName={"BUG_REPORT_LABELS"}
                value={process.env.BUG_REPORT_LABELS || "bug"}
            />
        </FeatureFlag.CanUseExplicitly>
    );
};
