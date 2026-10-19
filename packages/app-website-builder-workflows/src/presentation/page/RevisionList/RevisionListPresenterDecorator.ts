import { makeAutoObservable } from "mobx";
import { RevisionListPresenter } from "@webiny/app-website-builder/presentation/pages/RevisionList/abstractions.js";
import type { IRevisionListPresenterInit } from "@webiny/app-website-builder/presentation/pages/RevisionList/abstractions.js";
import type { IRevisionListVm } from "@webiny/app-website-builder/presentation/pages/RevisionList/abstractions.js";
import { WbPageReview } from "~/features/editorReview/WbPageReview.js";

/*
 * Publishing a revision straight from the editor's revisions drawer would bypass the review: the
 * drawer only offers Publish when the page's namespace has no workflow. While the review state
 * loads, fails or a workflow exists, the workflows Publish of the top bar is the only one, as with
 * `PageBasePublishDecorator`.
 */
class RevisionListPresenterWithWorkflows implements RevisionListPresenter.Interface {
    public constructor(
        private session: WbPageReview.Interface,
        private decoratee: RevisionListPresenter.Interface
    ) {
        makeAutoObservable<this, "session" | "decoratee">(this, {
            session: false,
            decoratee: false
        });
    }

    public get vm(): IRevisionListVm {
        const vm = this.decoratee.vm;
        const noWorkflow = this.session.presenter.vm.status === "noWorkflow";

        return {
            ...vm,
            revisions: vm.revisions.map(item => {
                return {
                    ...item,
                    canPublish: item.canPublish && noWorkflow
                };
            })
        };
    }

    public init(params: IRevisionListPresenterInit): void {
        this.decoratee.init(params);
    }
}

export const RevisionListPresenterDecorator = RevisionListPresenter.createDecorator({
    decorator: RevisionListPresenterWithWorkflows,
    dependencies: [WbPageReview]
});
