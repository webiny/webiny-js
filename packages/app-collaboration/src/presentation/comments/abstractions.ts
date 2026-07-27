import { createAbstraction } from "@webiny/feature/admin";
import type { CollabThread, CollabThreadType, CollabUser } from "~/types.js";

export interface ICreateThreadParams {
    locator: string;
    body: string;
    type?: CollabThreadType;
    mentions?: string[];
}

export interface ICommentsViewModel {
    loading: boolean;
    error: string | null;
    contentId: string | null;
    /** Whether the comments side panel is open (shared UI state). */
    isOpen: boolean;
    /** Locator the composer should default to (set by a field's "add comment" action). */
    activeLocator: string | null;
    /** When set, the panel shows only threads anchored to this field's locator. */
    filterLocator: string | null;
    /** Thread to visually highlight + scroll to (e.g. arriving from a notification deep-link). */
    highlightThreadId: string | null;
    /** Open (unresolved) threads whose anchor still exists. */
    threads: CollabThread[];
    /** Threads whose anchor no longer exists in the current revision. */
    outdatedThreads: CollabThread[];
    /** Resolved threads. */
    resolvedThreads: CollabThread[];
    unresolvedCount: number;
    fieldCount: number;
    /** Tenant members available to @mention. */
    mentionableUsers: CollabUser[];
    /** Composer draft state (owned by the presenter, rendered by the thin composer view). */
    composer: {
        body: string;
        mentions: string[];
        submitting: boolean;
    };
}

export interface ICommentsPresenter {
    readonly vm: ICommentsViewModel;
    init(contentId: string): Promise<void>;
    reload(): Promise<void>;
    openPanel(locator?: string): void;
    closePanel(): void;
    togglePanel(): void;
    /** Open the panel filtered to a single field's threads (from that field's comment marker). */
    openForField(locator: string): void;
    /** Remove the field filter and show all threads again. */
    clearFieldFilter(): void;
    setActiveLocator(locator: string | null): void;
    openAndHighlight(threadId: string): void;
    clearHighlight(): void;
    createThread(params: ICreateThreadParams): Promise<void>;
    /** Update the composer draft body. */
    setComposerBody(body: string): void;
    /** Add a mentioned user id to the composer draft (deduped). */
    addComposerMention(userId: string): void;
    /** Clear the composer draft (body + mentions). */
    resetComposer(): void;
    /** Validate + submit the composer draft as a new thread, then reset it. */
    submitComposer(): Promise<void>;
    reply(threadId: string, body: string, mentions?: string[]): Promise<void>;
    /** Validate + submit a reply to a thread. */
    submitReply(threadId: string, body: string, mentions?: string[]): Promise<void>;
    resolve(threadId: string): Promise<void>;
    reopen(threadId: string): Promise<void>;
    remove(threadId: string): Promise<void>;
    editMessage(threadId: string, messageId: string, body: string): Promise<void>;
    /** Validate + submit an edit to an existing message. */
    submitMessageEdit(threadId: string, messageId: string, body: string): Promise<void>;
    deleteMessage(threadId: string, messageId: string): Promise<void>;
}

export const CommentsPresenter = createAbstraction<ICommentsPresenter>(
    "Collaboration/CommentsPresenter"
);

export namespace CommentsPresenter {
    export type Interface = ICommentsPresenter;
    export type ViewModel = ICommentsViewModel;
    export type CreateParams = ICreateThreadParams;
}
