import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";

export interface ICmsEntrySystemWithReview {
    workflow?: SystemWorkflowValue | null;
}

/*
 * `CmsContentEntry["meta"]` does not declare `system`, but the entry list and entry reads select
 * `meta.system.workflow` (see the field selections).
 */
type CmsEntryMeta = CmsContentEntry["meta"];

export interface ICmsEntryMetaWithReview extends CmsEntryMeta {
    system?: ICmsEntrySystemWithReview | null;
}
