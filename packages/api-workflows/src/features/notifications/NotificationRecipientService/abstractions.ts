import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { ReviewValidationError } from "~/domain/review/errors.js";
import type { NotificationTransport } from "~/features/notifications/NotificationTransport/abstractions.js";

/** A person a notification goes to: an id and the name messages show (R194). */
export interface NotificationRecipient {
    id: string;
    displayName: string;
}

export interface NotificationPoolParams {
    review: ReviewData;
    /** The step that reached the pool. */
    stepId: string;
    /** The notification time: exclusion expiry is evaluated at this instant (R118). */
    now: Date;
}

export interface INotificationRecipientService {
    /**
     * The people a pool step is announced to (R183, R194): the members of the step's candidate
     * teams, without the requester, without an active exclusion and only those who can read the
     * target. Fails when the step is not in the review or routing fails.
     */
    listPool(
        params: NotificationPoolParams
    ): Promise<Result<NotificationRecipient[], WorkflowPersistenceError | ReviewValidationError>>;
    /**
     * The e-mail data of users by id (R194). Ids with no user (an api-key requester, A67) are
     * omitted. Runs the lookup without authorization, and only that. Users are returned as
     * stored: no address filtering here, a transport decides what it can use (the e-mail
     * transport filters addresses). A failed Result's message can embed addresses, so callers
     * must not log `error.message`: only `error.code` and `error.name` (R196).
     */
    listUsers(
        ids: string[]
    ): Promise<Result<NotificationTransport.User[], WorkflowPersistenceError>>;
}

/**
 * Finds the people a notification goes to. Internal (D132): no permission check. A failed or
 * throwing dependency is a failed Result; the caller logs it (R196) and still sends the
 * websocket message.
 */
export const NotificationRecipientService = createAbstraction<INotificationRecipientService>(
    "NotificationRecipientService"
);

export namespace NotificationRecipientService {
    export type Interface = INotificationRecipientService;
    export type Recipient = NotificationRecipient;
    export type PoolParams = NotificationPoolParams;
    export type Error = WorkflowPersistenceError;
    export type PoolReturn = Promise<
        Result<NotificationRecipient[], WorkflowPersistenceError | ReviewValidationError>
    >;
    export type UsersReturn = Promise<
        Result<NotificationTransport.User[], WorkflowPersistenceError>
    >;
}
