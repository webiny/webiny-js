import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { RecordLockingModel } from "~/domain/RecordLockingModel.js";
import { RecordLockingFeature } from "~/features/RecordLockingFeature.js";
import { RecordLockingGraphQLSchema } from "~/graphql/RecordLockingGraphQLSchema.js";
import { getTimeout } from "~/utils/getTimeout.js";

export interface IRecordLockingAppFeatureParams {
    /**
     * A number of seconds after the last activity to wait before the record is automatically unlocked.
     */
    timeout?: number;
}

export const RecordLockingAppFeature = createFeature<IRecordLockingAppFeatureParams>({
    name: "RecordLockingApp",
    register(container: Container, params: IRecordLockingAppFeatureParams) {
        // Record locking is license-gated — check at register time (license is fresh pre-register)
        // so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("recordLocking")) {
            return;
        }

        container.register(RecordLockingModel);
        RecordLockingFeature.register(container, {
            timeout: getTimeout(params?.timeout)
        });
        container.register(RecordLockingGraphQLSchema);
    }
});
