import { Plugin } from "@webiny/plugins";
import {
    ApwChangeRequest,
    ApwContentReview,
    ApwContentTypes,
    ApwContext,
    ApwReviewer,
    ApwWorkflow
} from "~/types";

interface ApwCommentNotificationCbParams {
    context: ApwContext;
    reviewers: ApwReviewer[];
    commentUrl: string;
    changeRequest: ApwChangeRequest;
    contentReview: ApwContentReview;
    workflow: ApwWorkflow;
}
interface ApwCommentNotificationCb {
    (params: ApwCommentNotificationCbParams): string | null;
}
export class ApwCommentNotification extends Plugin {
    public static override readonly type: string = "apw.notification.comment";

    private readonly contentType: ApwContentTypes;
    private readonly cb: ApwCommentNotificationCb;

    public constructor(contentType: ApwContentTypes, cb: ApwCommentNotificationCb) {
        super();
        this.contentType = contentType;
        this.cb = cb;
    }

    public canUse(contentType: ApwContentTypes): boolean {
        return contentType === this.contentType;
    }

    public create(params: ApwCommentNotificationCbParams): string | null {
        return this.cb(params);
    }
}
