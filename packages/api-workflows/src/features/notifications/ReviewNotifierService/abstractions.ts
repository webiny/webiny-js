import { createAbstraction } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    NotificationMessage,
    WorkflowNotificationEvent
} from "~/domain/notifications/types.js";
import type { NotificationRecipient } from "~/features/notifications/NotificationRecipientService/abstractions.js";

/** One message and the people it goes to. */
export interface NotificationDelivery {
    /** Already filtered by the handler (R183, R184); duplicates are removed here. */
    recipients: NotificationRecipient[];
    message: NotificationMessage;
}

export interface ReviewNotifyParams {
    /** The saved review: the namespace, ids and the steps whose channels are used. */
    review: ReviewData;
    /** The step whose `notifications` choose the transports (R186); `null` sends no transport. */
    stepId: string | null;
    event: WorkflowNotificationEvent;
    /**
     * One entry per distinct text: most events have one, a pool step one per team set. A person
     * should be in one delivery only; the notifier does not check it.
     */
    deliveries: NotificationDelivery[];
}

export interface IReviewNotifierService {
    /**
     * Tells the recipients of every delivery: one websocket frame each (connections of the
     * current tenant only, R188) and one call per transport the step lists and per delivery
     * (R186). One user lookup and at most one URL per link kind for the whole call. Never
     * rejects and never reports a failure (R196): every failure is logged once and the rest
     * still goes out.
     */
    notify(params: ReviewNotifyParams): Promise<void>;
}

/** Delivers one review notification. Internal (D132): no permission check. */
export const ReviewNotifierService =
    createAbstraction<IReviewNotifierService>("ReviewNotifierService");

export namespace ReviewNotifierService {
    export type Interface = IReviewNotifierService;
    export type Params = ReviewNotifyParams;
    export type Delivery = NotificationDelivery;
}
