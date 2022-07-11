import { ContentApwSettingsPlugin } from "~/ContentApwSettingsPlugin";
import { ApwContentTypes, PageWithWorkflow } from "~/types";
import set from "lodash/set";

export class PageApwSettingsGetterPlugin extends ContentApwSettingsPlugin {
    public override canUse(type: ApwContentTypes): boolean {
        return type === ApwContentTypes.PAGE;
    }

    public override setWorkflowId(page: PageWithWorkflow, id: string | null) {
        page.settings = set(page.settings || {}, "apw.workflowId", id);
    }

    public override getWorkflowId(page: PageWithWorkflow): string | null {
        if (!page.settings) {
            return null;
        }
        return page.settings.apw?.workflowId || null;
    }

    public override setContentReviewId(page: PageWithWorkflow, id: string | null) {
        page.settings = set(page.settings || {}, "apw.contentReviewId", id);
    }

    public override getContentReviewId(page: PageWithWorkflow): string | null {
        if (!page.settings) {
            return null;
        }
        return page.settings.apw?.contentReviewId;
    }
}
