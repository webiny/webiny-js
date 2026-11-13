import { createAbstraction } from "@webiny/feature/api";

/**
 * Sent to the user's open admin tabs when a record changes on the server. The admin keeps its own
 * copies of folders, teams, roles and users, and a change made on the server (by the assistant's
 * tools, a background task, another tab) never passes through them, so without this message the
 * admin shows the old state until a reload.
 *
 * Carries the record type and id only; the admin reads the record back, or drops it for `deleted`.
 * `RecordChangeMessages` in @webiny/app turns it into a `RecordChangedEvent`.
 */
export const RECORD_CHANGED_WEBSOCKET_ACTION = "record.changed";

export type RecordChange = "created" | "updated" | "deleted";

export interface RecordChangedMessageData {
    /** Names the kind of record, such as `security.team`. The admin handlers filter on it. */
    type: string;
    id: string;
    /**
     * For a record whose id only means something inside a parent: the parent's id. A CMS entry
     * carries its model id here, which the admin needs to read the entry back.
     */
    scope?: string;
    change: RecordChange;
}

export interface NotifyRecordChangeParams extends RecordChangedMessageData {
    /**
     * Whose open tabs to tell. Defaults to the current identity. Background tasks pass the identity
     * that made the change, because they run later, outside that request.
     */
    identityId?: string;
}

export interface INotifyRecordChangeUseCase {
    execute(params: NotifyRecordChangeParams): Promise<void>;
}

export const NotifyRecordChangeUseCase = createAbstraction<INotifyRecordChangeUseCase>(
    "Websockets/NotifyRecordChangeUseCase"
);

export namespace NotifyRecordChangeUseCase {
    export type Interface = INotifyRecordChangeUseCase;
    export type Params = NotifyRecordChangeParams;
    export type Change = RecordChange;
    export type MessageData = RecordChangedMessageData;
}
