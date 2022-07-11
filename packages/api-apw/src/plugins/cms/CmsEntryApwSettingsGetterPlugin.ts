import { ContentApwSettingsPlugin } from "~/ContentApwSettingsPlugin";
import { CmsEntry } from "@webiny/api-headless-cms/types";
import { ApwContentTypes } from "~/types";
import set from "lodash/set";

export class CmsEntryApwSettingsGetterPlugin extends ContentApwSettingsPlugin {
    public override canUse(type: ApwContentTypes): boolean {
        return type === ApwContentTypes.CMS_ENTRY;
    }

    public override setWorkflowId(entry: CmsEntry, id: string | null) {
        entry.meta = set(entry.meta || {}, "apw.workflowId", id);
    }

    public override getWorkflowId(entry: CmsEntry): string | null {
        if (!entry.meta) {
            return null;
        }
        return entry.meta.apw?.workflowId || null;
    }

    public override setContentReviewId(entry: CmsEntry, id: string | null) {
        entry.meta = set(entry.meta || {}, "apw.contentReviewId", id);
    }
    public override getContentReviewId(entry: CmsEntry): string | null {
        if (!entry.meta) {
            return null;
        }
        return entry.meta.apw?.contentReviewId || null;
    }
}
