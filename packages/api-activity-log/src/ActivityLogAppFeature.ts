import { type Container, createFeature } from "@webiny/feature/api";
import { CaptureFeature } from "~/cms/capture/feature.js";
import { PurgeFeature } from "~/cms/purge/feature.js";
import { RecorderFeature } from "~/cms/recorder/feature.js";
import { ReviewCaptureFeature } from "~/cms/review/feature.js";
import { ActivityRecordModel } from "~/storage/privateModel/ActivityRecordModel.js";
import { PrivateModelStorageFeature } from "~/storage/privateModel/feature.js";

export interface IActivityLogAppFeatureParams {
    /**
     * Whether the activity log is licensed for this installation.
     *
     * Required, with no default, and deliberately not resolved here.
     *
     * The obvious implementation — `FeatureFlags.get().isEnabled("activityLog")`, following
     * `RecordLockingAppFeature` — does not work yet, and fails in the worst direction. A flag name
     * absent from `LICENSE_CHECKS` resolves to *enabled* for anyone holding any licence, so that
     * call would gate nothing while reading exactly like a gate that works. Nor is there a public
     * way to ask whether an unregistered flag was explicitly set: `isEnabled` answers true,
     * `isExplicitlyDisabled` answers false, and `toDto()` re-derives only the names it already
     * knows.
     *
     * So the decision is pushed to the caller until the entitlement exists. A project that has not
     * decided cannot switch this on by accident, and the missing wiring is visible at the call site
     * rather than buried in a lookup that lies.
     *
     * Closing it properly needs `activityLog` added to `IFeatureFlagsDto`, `KnownFeatureFlag` and
     * `FeatureFlags.toDto()`; `canUseActivityLog()` on `ILicense`, `License`, `NullLicense` and
     * `ReactLicense`; an `ACTIVITY_LOG` entry in `PROJECT_PACKAGE_FEATURE_NAME`,
     * `WCP_FEATURE_LABEL` and `ProjectPackageFeatures`; and the flag registered in both
     * `LICENSE_CHECKS` maps. It also cannot become true until the WCP-issued licence payload
     * carries `features.activityLog`, which is outside this repository.
     *
     * Never `canUseAuditLogs`: reusing that entitlement would tie this feature to enterprise
     * permanently, and business tier is intended.
     */
    enabled: boolean;
}

/**
 * Entry point for the activity log.
 *
 * Registers nothing unless the installation is entitled, so an unlicensed project pays no cost at
 * all: no private model, no event handlers, no task definition.
 */
export const ActivityLogAppFeature = createFeature<IActivityLogAppFeatureParams>({
    name: "ActivityLogApp",
    register(container: Container, params: IActivityLogAppFeatureParams) {
        if (!params?.enabled) {
            return;
        }

        container.register(ActivityRecordModel);

        PrivateModelStorageFeature.register(container);
        RecorderFeature.register(container);
        CaptureFeature.register(container);
        ReviewCaptureFeature.register(container);
        PurgeFeature.register(container);
    }
});
