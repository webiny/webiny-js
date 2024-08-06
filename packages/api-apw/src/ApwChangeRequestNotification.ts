import { Plugin } from "@webiny/plugins";
import {
    ApwChangeRequest,
    ApwContentReview,
    ApwContentTypes,
    ApwContext,
    ApwReviewerWithEmail,
    ApwWorkflow
} from "~/types";

export interface ApwChangeRequestNotificationCbParams {
    context: ApwContext;
    reviewers: ApwReviewerWithEmail[];
    changeRequestUrl: string;
    contentUrl: string;
    changeRequest: ApwChangeRequest;
    contentReview: ApwContentReview;
    workflow: ApwWorkflow;
}
export interface ApwChangeRequestNotificationCbParamsResponse {
    text: string;
    html?: string;
}
export interface ApwChangeRequestNotificationCb {
    (
        params: ApwChangeRequestNotificationCbParams
    ): ApwChangeRequestNotificationCbParamsResponse | null | undefined;
}
export class ApwChangeRequestNotification extends Plugin {
    public static override readonly type: string = "apw.notification.changeRequest";

    private readonly contentType: ApwContentTypes;
    private readonly cb: ApwChangeRequestNotificationCb;

    public constructor(contentType: ApwContentTypes, cb: ApwChangeRequestNotificationCb) {
        super();
        this.contentType = contentType;
        this.cb = cb;
    }

    public canUse(contentType: ApwContentTypes): boolean {
        return contentType === this.contentType;
    }

    public create(params: ApwChangeRequestNotificationCbParams) {
        return this.cb(params);
    }
}

export const createApwChangeRequestNotification = (
    contentType: ApwContentTypes,
    cb: ApwChangeRequestNotificationCb
) => {
    return new ApwChangeRequestNotification(contentType, cb);
};
