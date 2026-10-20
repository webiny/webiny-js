export type CollabThreadType = "note" | "task";

export interface CollabIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface CollabMessage {
    id: string;
    body: string;
    mentions: string[];
    createdBy: CollabIdentity;
    createdOn: string;
    deleted?: boolean | null;
    deletedBy?: CollabIdentity | null;
    deletedOn?: string | null;
}

export interface CollabAnchor {
    exists: boolean;
    authorized: boolean;
    label?: string | null;
    path?: string[] | null;
}

export interface CollabThread {
    id: string;
    contentType: string;
    contentId: string;
    locator: string;
    type: CollabThreadType;
    resolved: boolean;
    resolvedBy?: CollabIdentity | null;
    resolvedOn?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
    messages: CollabMessage[];
    createdBy: CollabIdentity;
    createdOn: string;
    anchor: CollabAnchor;
}

export interface CollabUser {
    id: string;
    displayName: string;
    email?: string | null;
    avatar?: { src?: string } | null;
}

export interface CollabThreadsMeta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}

export interface ListThreadsWhere {
    contentType: string;
    contentId: string;
    type?: CollabThreadType;
    resolved?: boolean;
}

export interface CreateThreadInput {
    contentType: string;
    contentId: string;
    locator: string;
    type: CollabThreadType;
    body: string;
    mentions?: string[];
    assigneeId?: string | null;
    dueDate?: string | null;
}
