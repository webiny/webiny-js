import { Plugin } from "@webiny/plugins";
import {
    ApwChangeRequest,
    ApwContentReview,
    ApwContentTypes,
    ApwContext,
    ApwReviewerWithEmail,
    ApwWorkflow
} from "~/types";

export interface ApwCommentNotificationCbParams {
    context: ApwContext;
    reviewers: ApwReviewerWithEmail[];
    commentUrl: string;
    contentUrl: string;
    changeRequest: ApwChangeRequest;
    contentReview: ApwContentReview;
    workflow: ApwWorkflow;
}
export interface ApwCommentNotificationCbParamsResponse {
    text: string;
    html?: string;
}
export interface ApwCommentNotificationCb {
    (
        params: ApwCommentNotificationCbParams
    ): ApwCommentNotificationCbParamsResponse | null | undefined;
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

    public create(params: ApwCommentNotificationCbParams) {
        return this.cb(params);
    }
}

export const createApwCommentNotification = (
    contentType: ApwContentTypes,
    cb: ApwCommentNotificationCb
) => {
    return new ApwCommentNotification(contentType, cb);
};
