import { makeAutoObservable } from "mobx";
import {
    type IRevisionListPresenterInit,
    type IRevisionListVm,
    RevisionListPresenter
} from "@webiny/app-website-builder/presentation/pages/RevisionList/abstractions.js";

/**
 * Publishing a page revision straight from the revisions drawer bypasses the workflow: the top bar
 * hides its own Publish button while a review is in progress, but the drawer knew nothing about
 * workflows and kept offering the action.
 *
 * This decorator is registered only from within `Wcp.CanUseWorkflows`, so its presence already
 * means workflows are enabled for the project. That is a blunt rule - it also hides the action on
 * a page no workflow applies to - but it is the safe direction while the drawer has no access to
 * the per-page workflow state. Publishing remains available from the top bar, which does know it.
 */
class RevisionListPresenterWithWorkflows implements RevisionListPresenter.Interface {
    private readonly decoratee;

    public constructor(decoratee: RevisionListPresenter.Interface) {
        this.decoratee = decoratee;
        makeAutoObservable(this);
    }

    public get vm(): IRevisionListVm {
        const vm = this.decoratee.vm;

        return {
            ...vm,
            revisions: vm.revisions.map(item => {
                return {
                    ...item,
                    canPublish: false
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
    dependencies: []
});
