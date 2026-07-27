import { makeAutoObservable, runInAction, toJS } from "mobx";
import { CommentsPresenter as PresenterAbstraction } from "./abstractions.js";
import type { ICreateThreadParams } from "./abstractions.js";
import { CollaborationApi } from "~/features/api/abstractions.js";
import { CONTENT_TYPE_CMS_ENTRY } from "~/constants.js";
import type { CollabThread, CollabUser } from "~/types.js";

/**
 * Extracts a human-readable message from an Apollo-style error (which otherwise surfaces the
 * generic "GraphQL errors").
 */
const readableError = (err: unknown): string => {
    const error = err as {
        message?: string;
        graphQLErrors?: Array<{ message?: string }>;
        networkError?: { message?: string };
    };
    return (
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.message ||
        error?.message ||
        "Failed to load comments."
    );
};

class CommentsPresenterImpl implements PresenterAbstraction.Interface {
    private contentId: string | null = null;
    private threads: CollabThread[] = [];
    private loading = false;
    private error: string | null = null;
    private isOpen = false;
    private activeLocator: string | null = null;
    private filterLocator: string | null = null;
    private highlightThreadId: string | null = null;
    private users: CollabUser[] = [];
    // Composer draft state lives on the presenter so the React composer stays a thin view.
    private composerBody = "";
    private composerMentions: string[] = [];
    private composerSubmitting = false;

    constructor(private api: CollaborationApi.Interface) {
        makeAutoObservable<CommentsPresenterImpl, "api">(this, { api: false });
    }

    openPanel(locator?: string) {
        this.isOpen = true;
        // No locator => entry-level (unanchored) comment.
        this.activeLocator = locator ?? null;
        // A general open (or "add comment" on a field) shows all threads.
        this.filterLocator = null;
    }

    closePanel() {
        this.isOpen = false;
        this.filterLocator = null;
    }

    togglePanel() {
        this.isOpen = !this.isOpen;
        this.filterLocator = null;
    }

    openForField(locator: string) {
        this.isOpen = true;
        this.filterLocator = locator;
        this.activeLocator = locator;
    }

    clearFieldFilter() {
        this.filterLocator = null;
    }

    setActiveLocator(locator: string | null) {
        this.activeLocator = locator;
    }

    openAndHighlight(threadId: string) {
        this.openPanel();
        this.highlightThreadId = threadId;
    }

    clearHighlight() {
        this.highlightThreadId = null;
    }

    get vm(): PresenterAbstraction.ViewModel {
        // Soft-deleted threads are filtered out server-side, so everything here is live.
        const active = this.threads;
        const open = active.filter(thread => !thread.resolved && thread.anchor.exists);
        const outdated = active.filter(thread => !thread.resolved && !thread.anchor.exists);
        const resolved = active.filter(thread => thread.resolved);
        // Only field-anchored threads count toward "across N fields".
        const fields = new Set(open.filter(thread => thread.locator).map(thread => thread.locator));

        return {
            loading: this.loading,
            error: this.error,
            contentId: this.contentId,
            isOpen: this.isOpen,
            activeLocator: this.activeLocator,
            filterLocator: this.filterLocator,
            highlightThreadId: this.highlightThreadId,
            threads: toJS(open),
            outdatedThreads: toJS(outdated),
            resolvedThreads: toJS(resolved),
            unresolvedCount: open.length + outdated.length,
            fieldCount: fields.size,
            mentionableUsers: toJS(this.users),
            composer: {
                body: this.composerBody,
                mentions: toJS(this.composerMentions),
                submitting: this.composerSubmitting
            }
        };
    }

    setComposerBody(body: string) {
        this.composerBody = body;
    }

    addComposerMention(userId: string) {
        if (!this.composerMentions.includes(userId)) {
            this.composerMentions.push(userId);
        }
    }

    resetComposer() {
        this.composerBody = "";
        this.composerMentions = [];
    }

    async submitComposer() {
        if (!this.composerBody.trim() || this.composerSubmitting) {
            return;
        }
        runInAction(() => {
            this.composerSubmitting = true;
        });
        try {
            // Empty locator => entry-level (unanchored) comment.
            await this.createThread({
                locator: this.activeLocator ?? "",
                body: this.composerBody,
                mentions: toJS(this.composerMentions)
            });
            this.resetComposer();
        } finally {
            runInAction(() => {
                this.composerSubmitting = false;
            });
        }
    }

    async init(contentId: string) {
        if (this.contentId === contentId && this.threads.length > 0) {
            return;
        }
        runInAction(() => {
            this.contentId = contentId;
        });
        void this.loadUsers();
        await this.reload();
    }

    private async loadUsers() {
        if (this.users.length > 0) {
            return;
        }
        try {
            const users = await this.api.listMentionableUsers();
            runInAction(() => {
                this.users = users;
            });
        } catch {
            // Best-effort — mentions simply won't autocomplete.
        }
    }

    async reload() {
        if (!this.contentId) {
            return;
        }
        runInAction(() => {
            this.loading = true;
            this.error = null;
        });
        try {
            const result = await this.api.listThreads({
                contentType: CONTENT_TYPE_CMS_ENTRY,
                contentId: this.contentId
            });
            runInAction(() => {
                this.threads = result.items;
                this.loading = false;
            });
        } catch (err) {
            console.error("[collaboration] failed to load comment threads", err);
            runInAction(() => {
                this.error = readableError(err);
                this.loading = false;
            });
        }
    }

    async createThread(params: ICreateThreadParams) {
        if (!this.contentId) {
            return;
        }
        const thread = await this.api.createThread({
            contentType: CONTENT_TYPE_CMS_ENTRY,
            contentId: this.contentId,
            locator: params.locator,
            type: params.type ?? "note",
            body: params.body,
            mentions: params.mentions
        });
        runInAction(() => {
            this.threads = [thread, ...this.threads];
        });
    }

    async reply(threadId: string, body: string, mentions?: string[]) {
        await this.api.replyToThread(threadId, body, mentions);
        await this.reload();
    }

    /**
     * Owns reply validation + the reply use-case call. The reply input state stays local to the
     * thread card (a view concern), but the submit orchestration lives here.
     */
    async submitReply(threadId: string, body: string, mentions?: string[]) {
        if (!body.trim()) {
            return;
        }
        await this.reply(threadId, body, mentions);
    }

    async resolve(threadId: string) {
        const updated = await this.api.resolveThread(threadId);
        this.replaceThread(updated);
    }

    async reopen(threadId: string) {
        const updated = await this.api.reopenThread(threadId);
        this.replaceThread(updated);
    }

    async remove(threadId: string) {
        await this.api.deleteThread(threadId);
        runInAction(() => {
            this.threads = this.threads.filter(thread => thread.id !== threadId);
        });
    }

    async editMessage(threadId: string, messageId: string, body: string) {
        await this.api.updateMessage(threadId, messageId, body);
        await this.reload();
    }

    /**
     * Owns message-edit validation + the edit use-case call. The edit draft state stays local to
     * the message component (a view concern), but the submit orchestration lives here.
     */
    async submitMessageEdit(threadId: string, messageId: string, body: string) {
        if (!body.trim()) {
            return;
        }
        await this.editMessage(threadId, messageId, body);
    }

    async deleteMessage(threadId: string, messageId: string) {
        await this.api.deleteMessage(threadId, messageId);
        await this.reload();
    }

    private replaceThread(updated: CollabThread) {
        runInAction(() => {
            this.threads = this.threads.map(thread =>
                thread.id === updated.id ? updated : thread
            );
        });
    }
}

export const CommentsPresenter = PresenterAbstraction.createImplementation({
    implementation: CommentsPresenterImpl,
    dependencies: [CollaborationApi]
});
