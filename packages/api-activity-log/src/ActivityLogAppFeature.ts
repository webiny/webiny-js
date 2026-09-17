import { type Container, createFeature } from "@webiny/feature/api";
import { CaptureFeature } from "~/cms/capture/feature.js";
import { PurgeFeature } from "~/cms/purge/feature.js";
import { RecorderFeature } from "~/cms/recorder/feature.js";
import { ListActivityFeature } from "~/features/listActivity/feature.js";
import { ActivityLogPermissionsFeature } from "~/features/permissions/feature.js";
import { ReviewCaptureFeature } from "~/cms/review/feature.js";
import { ActivityLogGraphQLFactory } from "~/graphql/ActivityLogGraphQLFactory.js";
import { ActivityRecordModel } from "~/storage/privateModel/ActivityRecordModel.js";
import { PrivateModelStorageFeature } from "~/storage/privateModel/feature.js";

export interface IActivityLogAppFeatureParams {
    /**
     * Whether the activity log runs in this installation.
     *
     * Required, with no default, and deliberately not resolved here.
     *
     * The original reason was that a flag lookup could not work: a name absent from
     * `LICENSE_CHECKS` used to resolve to *enabled* for anyone holding any licence, so
     * `isEnabled("activityLog")` would have gated nothing while reading exactly like a gate that
     * works. #5695 removed that behaviour — an unrecognised name is now the project's own flag and
     * answers false unless the project's config sets it true — so a lookup would now be safe.
     *
     * It is still not what this parameter wants. A project-configured flag makes the feature opt-in
     * per installation; it does not make it something Webiny can sell, because nothing on the
     * licence governs it. Reading one here would swap an explicit decision at the call site for an
     * implicit "off" that looks like an entitlement and is not one.
     *
     * Selling it needs `activityLog` added to `IFeatureFlagsDto`, `KnownFeatureFlag` and
     * `FeatureFlags.toDto()`; `canUseActivityLog()` on `ILicense`, `License`, `NullLicense` and
     * `ReactLicense`; an `ACTIVITY_LOG` entry in `PROJECT_PACKAGE_FEATURE_NAME`,
     * `WCP_FEATURE_LABEL` and `ProjectPackageFeatures`; and an entry in `LICENSE_CHECKS`. It also
     * cannot become true until the WCP-issued licence payload carries `features.activityLog`,
     * which is outside this repository.
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
        ActivityLogPermissionsFeature.register(container);
        RecorderFeature.register(container);
        ListActivityFeature.register(container);
        container.register(ActivityLogGraphQLFactory);
        CaptureFeature.register(container);
        ReviewCaptureFeature.register(container);
        PurgeFeature.register(container);
    }
});
