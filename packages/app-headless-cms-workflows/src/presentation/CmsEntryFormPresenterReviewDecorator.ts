import { computed } from "mobx";
import { makeAutoObservable } from "mobx";
import { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { CmsEntryReview } from "~/features/editorReview/abstractions.js";
import { getCmsEntryReviewContext } from "~/presentation/getCmsEntryReviewContext.js";
import { CmsEntryContentReloader } from "~/presentation/CmsEntryContentReloader.js";
import { getCmsEntryReviewInitParams } from "~/presentation/getCmsEntryReviewInitParams.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

/*
 * idle: the form is not tied to a review (new entry, singleton model, nothing loaded).
 * loading: a revision is being loaded, the review status is not asked yet.
 * tracking: the shared presenter was initialised for the loaded revision.
 */
type ReviewPhase = "idle" | "loading" | "tracking";

interface SaveRevisionOptions {
    skipValidation?: boolean;
}

class CmsEntryFormPresenterWithReview implements ContentEntryFormPresenter.Interface {
    private phase: ReviewPhase = "idle";
    private revisionId: string | null = null;

    constructor(
        private readonly session: CmsEntryReview.Interface,
        private readonly original: ContentEntryFormPresenter.Interface
    ) {
        makeAutoObservable<CmsEntryFormPresenterWithReview, "session" | "original">(this, {
            session: false,
            original: false,
            vm: computed
        });
    }

    get vm(): ContentEntryFormPresenter.ViewModel {
        const base = this.original.vm;

        if (this.phase === "idle") {
            return base;
        }

        if (this.phase === "loading") {
            return { ...base, canSave: false, canCreateNewRevision: false, canPublish: false };
        }

        const review = this.session.presenter.vm;

        return {
            ...base,
            canSave: base.canSave && review.allowsEditing,
            // The base "New Revision" button reads only this flag and saves through `saveRevision`.
            canCreateNewRevision: base.canCreateNewRevision && review.allowsEditing,
            canPublish: base.canPublish && review.allowsPublishing
        };
    }

    async loadRevision(id: string): Promise<void> {
        const model = this.original.vm.model;

        if (!isReviewableModel(model)) {
            this.setPhase("idle", null);
            await this.original.loadRevision(id);
            return;
        }

        this.setPhase("loading", id);

        try {
            await this.original.loadRevision(id);
        } catch (error) {
            this.setPhase("idle", null);
            throw error;
        }

        // The editor was reset or moved to another revision while this one was loading.
        if (this.phase !== "loading" || this.revisionId !== id) {
            return;
        }

        const entry = this.original.vm.entry;

        if (!entry) {
            this.setPhase("idle", null);
            return;
        }

        this.setPhase("tracking", entry.id);

        const contentReloader = new CmsEntryContentReloader(this.original, entry.id);
        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest: this.original.vm.canSave,
            contentReloader
        });

        await this.session.presenter.init(params);
    }

    async saveRevision(options?: SaveRevisionOptions): Promise<boolean> {
        if (this.phase === "idle") {
            return this.original.saveRevision(options);
        }

        if (this.phase === "loading") {
            return false;
        }

        const review = this.session.presenter.vm;

        if (!review.allowsEditing) {
            // Nothing can be saved while the status is unknown or a review locks the content.
            // A clean, unlocked approved draft still reports success, so that "Save & Publish"
            // goes on to publish. A locked entry never does: saving it would create a new
            // revision.
            const entry = this.original.vm.entry;
            const isCleanDraft = entry !== null && !entry.meta.locked && !this.original.vm.isDirty;

            return review.allowsPublishing && isCleanDraft;
        }

        const saved = await this.original.saveRevision(options);
        const entry = this.original.vm.entry;

        if (!saved || !entry) {
            return saved;
        }

        const model = this.original.vm.model;
        const canRequest = this.original.vm.canSave;

        if (entry.id === this.revisionId) {
            const context = getCmsEntryReviewContext(model, entry, canRequest);
            this.session.presenter.setContext(context);
            return saved;
        }

        // Saving a locked revision creates a new revision, which has no review yet.
        this.setPhase("tracking", entry.id);

        const contentReloader = new CmsEntryContentReloader(this.original, entry.id);
        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest,
            contentReloader
        });

        await this.session.presenter.init(params);

        return saved;
    }

    async publishRevision(): Promise<boolean> {
        if (this.phase === "idle") {
            return this.original.publishRevision();
        }

        if (this.phase === "loading" || !this.session.presenter.vm.allowsPublishing) {
            return false;
        }

        const published = await this.original.publishRevision();
        const entry = this.original.vm.entry;

        if (published && entry) {
            const context = getCmsEntryReviewContext(
                this.original.vm.model,
                entry,
                this.original.vm.canSave
            );
            this.session.presenter.setContext(context);
        }

        return published;
    }

    async unpublishRevision(): Promise<boolean> {
        const unpublished = await this.original.unpublishRevision();
        const entry = this.original.vm.entry;

        if (unpublished && entry && this.phase === "tracking") {
            const context = getCmsEntryReviewContext(
                this.original.vm.model,
                entry,
                this.original.vm.canSave
            );
            this.session.presenter.setContext(context);
        }

        return unpublished;
    }

    deleteEntry(): Promise<boolean> {
        return this.original.deleteEntry();
    }

    setFolderId(folderId: string | null): void {
        this.original.setFolderId(folderId);
    }

    newEntry(initialValues?: Record<string, unknown>): void {
        this.setPhase("idle", null);
        this.original.newEntry(initialValues);
    }

    patchEntryMeta(
        meta: Parameters<ContentEntryFormPresenter.Interface["patchEntryMeta"]>[0]
    ): void {
        this.original.patchEntryMeta(meta);
    }

    reset(): void {
        this.original.reset();
        this.session.presenter.dispose();
        this.setPhase("idle", null);
    }

    private setPhase(phase: ReviewPhase, revisionId: string | null): void {
        this.phase = phase;
        this.revisionId = revisionId;
    }
}

export const CmsEntryFormPresenterReviewDecorator = ContentEntryFormPresenter.createDecorator({
    decorator: CmsEntryFormPresenterWithReview,
    dependencies: [CmsEntryReview]
});
