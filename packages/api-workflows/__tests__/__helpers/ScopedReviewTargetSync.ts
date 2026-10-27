import { Result } from "@webiny/feature/api";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { callLog } from "./callLog.js";

/** A sync for one model that logs `sync:<label>` into the shared call log. */
export const createScopedReviewTargetSync = (label: string, model: string) => {
    class ScopedReviewTargetSyncImpl implements ReviewTargetSync.Interface {
        canSync(candidate: string): boolean {
            return candidate === model;
        }

        async sync(): ReviewTargetSync.Return {
            callLog.push(`sync:${label}`);
            return Result.ok();
        }
    }

    return ReviewTargetSync.createImplementation({
        implementation: ScopedReviewTargetSyncImpl,
        dependencies: []
    });
};
