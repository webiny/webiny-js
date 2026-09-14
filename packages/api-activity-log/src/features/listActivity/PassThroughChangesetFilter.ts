import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ActivityRecord } from "~/core/types.js";
import { ActivityChangesetFilter } from "./abstractions.js";

/**
 * The default: every path, unfiltered.
 *
 * Not a placeholder for missing work — it is the correct behaviour today. The CMS field permission
 * evaluator returns `false` unconditionally, so no field is restricted for anybody and there is
 * nothing to filter against. Filtering here would be the product's first field-permission
 * enforcement point, which is a strange place for enforcement to debut.
 *
 * Records store full paths so that a filter can be applied later without a data migration. When
 * AACL implements field permissions, a decorator over this abstraction is the whole change.
 */
class PassThroughChangesetFilterImpl implements ActivityChangesetFilter.Interface {
    async filter(records: ActivityRecord[], _model: CmsModel): Promise<ActivityRecord[]> {
        return records;
    }
}

export const PassThroughChangesetFilter = ActivityChangesetFilter.createImplementation({
    implementation: PassThroughChangesetFilterImpl,
    dependencies: []
});
