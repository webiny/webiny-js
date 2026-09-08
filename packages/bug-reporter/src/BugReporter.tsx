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
 * Deliberately NOT added to `DefaultExtensions.tsx`. A non-licensed flag reads as enabled when a
 * licensed project leaves the key unset (see FeatureFlagsWithLicenseDecorator rule 6), so shipping
 * it there would switch it on for existing customers on upgrade. Registering it only from this
 * repo's own `webiny.config.tsx` is what makes it internal; the flag is the switch we flip.
 *
 * Promoting it to a real feature later means moving one line into `DefaultExtensions.tsx`.
 */
export const BugReporter = () => {
    return (
        <FeatureFlag.CanUse name={"bugReporter"}>
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
        </FeatureFlag.CanUse>
    );
};
