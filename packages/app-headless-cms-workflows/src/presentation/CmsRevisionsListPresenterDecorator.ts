import { makeAutoObservable } from "mobx";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { RevisionsListPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/revisionsList/abstractions.js";
import { CmsEntryReview } from "~/features/editorReview/CmsEntryReview.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

/*
 * Publishing a revision straight from the revisions drawer would bypass the review: on a
 * reviewable model the drawer only offers Publish when the model has no workflow. While the review
 * state loads, fails or a workflow exists, the review bar's Publish is the only one, as in the
 * Website Builder drawer. Unpublish is not review-gated (D121), so it stays as the base computes it.
 */
class CmsRevisionsListPresenterWithReview implements RevisionsListPresenter.Interface {
    public constructor(
        private modelContext: CmsModelContext.Interface,
        private session: CmsEntryReview.Interface,
        private decoratee: RevisionsListPresenter.Interface
    ) {
        makeAutoObservable<this, "modelContext" | "session" | "decoratee">(this, {
            modelContext: false,
            session: false,
            decoratee: false
        });
    }

    public get vm(): RevisionsListPresenter.ViewModel {
        const vm = this.decoratee.vm;
        if (!isReviewableModel(this.modelContext.getModel())) {
            return vm;
        }
        const noWorkflow = this.session.presenter.vm.status === "noWorkflow";

        return {
            ...vm,
            items: vm.items.map(item => {
                return {
                    ...item,
                    canPublish: item.canPublish && noWorkflow
                };
            })
        };
    }

    public init(entryId: string): Promise<void> {
        return this.decoratee.init(entryId);
    }

    public show(): void {
        this.decoratee.show();
    }

    public hide(): void {
        this.decoratee.hide();
    }

    public createRevision(revisionId: string): Promise<CmsContentEntry | null> {
        return this.decoratee.createRevision(revisionId);
    }

    public publishRevision(revisionId: string): Promise<boolean> {
        return this.decoratee.publishRevision(revisionId);
    }

    public unpublishRevision(revisionId: string): Promise<boolean> {
        return this.decoratee.unpublishRevision(revisionId);
    }

    public updateRevisionNote(revisionId: string, currentDescription: string): Promise<boolean> {
        return this.decoratee.updateRevisionNote(revisionId, currentDescription);
    }

    public deleteRevision(revisionId: string): Promise<boolean> {
        return this.decoratee.deleteRevision(revisionId);
    }

    public dispose(): void {
        this.decoratee.dispose();
    }
}

export const CmsRevisionsListPresenterDecorator = RevisionsListPresenter.createDecorator({
    decorator: CmsRevisionsListPresenterWithReview,
    dependencies: [CmsModelContext, CmsEntryReview]
});
