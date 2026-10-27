import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ActivityRecord } from "~/api/core/types.js";
import { ActivitySummaryVisibility } from "./abstractions.js";

/**
 * The default: every summary, to every reader who may read the timeline at all.
 *
 * Correct behaviour rather than a placeholder, for the same reason as `PassThroughChangesetFilter`.
 * A reader who reaches this point has already passed `activityLog.timeline` and a full CMS read
 * authorisation on the target entry — they can open the entry and read the content the summary
 * describes. Withholding the sentence while handing over the entry would be theatre.
 *
 * It becomes real if field-level permissions ever arrive, where a reader may hold the entry but not
 * one field in it. A decorator over this abstraction is then the whole change.
 */
class ShowAllSummariesImpl implements ActivitySummaryVisibility.Interface {
    async hidden(_records: ActivityRecord[], _model: CmsModel): Promise<Set<string>> {
        return new Set();
    }
}

export const ShowAllSummaries = ActivitySummaryVisibility.createImplementation({
    implementation: ShowAllSummariesImpl,
    dependencies: []
});
