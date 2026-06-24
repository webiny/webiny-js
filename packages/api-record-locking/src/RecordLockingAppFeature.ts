import { type Container, createFeature } from "@webiny/feature/api";
import { RecordLockingModel } from "~/domain/RecordLockingModel.js";
import { RecordLockingAppConfig } from "~/domain/RecordLockingAppConfig.js";
import { getTimeout } from "~/utils/getTimeout.js";
import { RecordLockingContextualSchema } from "~/graphql/RecordLockingContextualSchema.js";

export interface IRecordLockingAppFeatureParams {
    /**
     * A number of seconds after the last activity to wait before the record is automatically unlocked.
     */
    timeout?: number;
}

export const RecordLockingAppFeature = createFeature<IRecordLockingAppFeatureParams>({
    name: "RecordLockingApp",
    register(container: Container, params: IRecordLockingAppFeatureParams) {
        container.register(RecordLockingModel);
        container.registerInstance(RecordLockingAppConfig, {
            timeout: getTimeout(params?.timeout)
        });
        container.register(RecordLockingContextualSchema);
    }
});
