import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { CaptureFeature } from "~/cms/capture/feature.js";
import { PurgeFeature } from "~/cms/purge/feature.js";
import { RecorderFeature } from "~/cms/recorder/feature.js";
import { ListActivityFeature } from "~/features/listActivity/feature.js";
import { ActivityLogPermissionsFeature } from "~/features/permissions/feature.js";
import { ReviewCaptureFeature } from "~/cms/review/feature.js";
import { ActivityLogGraphQLFactory } from "~/graphql/ActivityLogGraphQLFactory.js";
import { ActivityRecordModel } from "~/storage/privateModel/ActivityRecordModel.js";
import { PrivateModelStorageFeature } from "~/storage/privateModel/feature.js";

/**
 * Entry point for the activity log.
 *
 * Licence-gated at register time, following `RecordLockingAppFeature`: the licence is fresh before
 * register runs, so nothing wires up without the entitlement and an unlicensed project pays no cost
 * at all — no private model, no event handlers, no task definition.
 *
 * `collaboration.activityLog` is nested under `collaboration`, and `License.canUseActivityLog()`
 * returns false unless both are granted. The flag is the only thing read here: a project may switch
 * the feature off through config, but config can never re-enable what the licence withholds.
 *
 * This replaces an `enabled` parameter the caller had to supply. That parameter existed because
 * until #5728 there was no entitlement to read — an unregistered flag name resolved to *enabled*
 * for anyone holding any licence, so a lookup would have gated nothing while reading exactly like a
 * gate that works. #5728 added `canUseActivityLog()` across `ILicense`, `License`, `NullLicense` and
 * `ReactLicense`, the `collaboration.activityLog` entry in `LICENSE_CHECKS`, and the flag in
 * `KnownFeatureFlag` and `FeatureFlags.toDto()`. The gate this package documented as open is now
 * closed, and the decision belongs here rather than at every call site.
 *
 * Never `canUseAuditLogs`: reusing that entitlement would tie this feature to enterprise
 * permanently, and business tier is intended.
 */
export const ActivityLogAppFeature = createFeature({
    name: "ActivityLogApp",
    register(container: Container) {
        if (!container.resolve(FeatureFlags).get().isEnabled("collaboration.activityLog")) {
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
