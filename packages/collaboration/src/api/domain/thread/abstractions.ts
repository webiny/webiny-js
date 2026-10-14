import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry } from "@webiny/api-headless-cms/types";

export enum CollabThreadType {
    note = "note",
    task = "task"
}

/**
 * The canonical Webiny identity projection stored on records and messages.
 */
export interface ICollabIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface ICollabMessage {
    id: string;
    body: string;
    mentions: string[];
    createdBy: ICollabIdentity;
    createdOn: string;
    deleted?: boolean;
    deletedBy?: ICollabIdentity | null;
    deletedOn?: string | null;
}

/**
 * The values persisted on the `wbyCollabThread` CMS entry. `createdBy`/`createdOn` for the
 * thread itself are the CMS entry system fields and are NOT part of the stored values.
 */
export interface ICollabThreadValues {
    contentType: string;
    contentId: string;
    locator: string;
    type: CollabThreadType;
    resolved: boolean;
    resolvedBy?: ICollabIdentity | null;
    resolvedOn?: string | null;
    // task variant only
    assigneeId?: string | null;
    dueDate?: string | null;
    messages: ICollabMessage[];
}

export interface ICollabThread extends ICollabThreadValues {
    id: string;
    createdBy: ICollabIdentity;
    createdOn: string;
}

export interface ICollabThreadMapper {
    fromCmsEntry(entry: CmsEntry<ICollabThreadValues>): ICollabThread;
}

export const CollabThreadMapper = createAbstraction<ICollabThreadMapper>("CollabThreadMapper");

export namespace CollabThreadMapper {
    export type Interface = ICollabThreadMapper;
}
