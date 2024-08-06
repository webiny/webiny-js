import { Plugin } from "@webiny/plugins";
import {
    ApwContentReview,
    ApwContentTypes,
    ApwContext,
    ApwReviewerWithEmail,
    ApwWorkflow
} from "~/types";

export interface ApwContentReviewNotificationCbParams {
    context: ApwContext;
    reviewers: ApwReviewerWithEmail[];
    contentReviewUrl: string;
    contentUrl: string;
    contentReview: ApwContentReview;
    workflow: ApwWorkflow;
}
export interface ApwContentReviewNotificationCbParamsResponse {
    text: string;
    html?: string;
}
export interface ApwContentReviewNotificationCb {
    (
        params: ApwContentReviewNotificationCbParams
    ): ApwContentReviewNotificationCbParamsResponse | null | undefined;
}
export class ApwContentReviewNotification extends Plugin {
    public static override readonly type: string = "apw.notification.contentReview";

    private readonly contentType: ApwContentTypes;
    private readonly cb: ApwContentReviewNotificationCb;

    public constructor(contentType: ApwContentTypes, cb: ApwContentReviewNotificationCb) {
        super();
        this.contentType = contentType;
        this.cb = cb;
    }

    public canUse(contentType: ApwContentTypes): boolean {
        return contentType === this.contentType;
    }

    public create(params: ApwContentReviewNotificationCbParams) {
        return this.cb(params);
    }
}

export const createApwContentReviewNotification = (
    contentType: ApwContentTypes,
    cb: ApwContentReviewNotificationCb
) => {
    return new ApwContentReviewNotification(contentType, cb);
};
