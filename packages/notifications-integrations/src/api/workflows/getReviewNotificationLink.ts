import type { WorkflowModelParser } from "@webiny/api-workflows/features/model/WorkflowModelParser/index.js";
import { APP_HEADLESS_CMS } from "~/shared/constants.js";

export interface ReviewNotificationLink {
    app: string;
    contentId: string;
}

/*
 * A CMS entry link carries "<modelId>:<entryId>", which the inbox opens. Any other app gets its app
 * id and the bare target id; the inbox does not open those yet. A model no app knows gets no link.
 */
export const getReviewNotificationLink = (
    parsed: WorkflowModelParser.Parsed | null,
    targetId: string
): ReviewNotificationLink | null => {
    if (!parsed) {
        return null;
    }
    if (parsed.app === APP_HEADLESS_CMS) {
        return { app: parsed.app, contentId: `${parsed.modelId}:${targetId}` };
    }
    return { app: parsed.app, contentId: targetId };
};
