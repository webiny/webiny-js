import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { ActivityRecordModel } from "~/storage/privateModel/ActivityRecordModel.js";
import { PrivateModelStorageFeature } from "~/storage/privateModel/feature.js";

/**
 * Entry point for the activity log.
 *
 * License-gated at register time, following `RecordLockingAppFeature`, so that nothing wires up
 * without the entitlement. The gate is a feature flag whose value comes from the license, which is
 * what keeps tier a license-side concern: moving the feature from enterprise to business tier
 * changes what `canUseActivityLog()` returns and requires no change here.
 *
 * Deliberately not gated on `auditLogs`. Reusing that entitlement would tie this feature to
 * enterprise permanently.
 */
export const ActivityLogAppFeature = createFeature({
    name: "ActivityLogApp",
    register(container: Container) {
        if (!container.resolve(FeatureFlags).get().isEnabled("activityLog")) {
            return;
        }

        container.register(ActivityRecordModel);

        PrivateModelStorageFeature.register(container);
    }
});
