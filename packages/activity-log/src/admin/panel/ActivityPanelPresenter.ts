import { makeAutoObservable } from "mobx";
import { createAbstraction } from "@webiny/feature/admin";

export interface IActivityPanelViewModel {
    open: boolean;
}

export interface IActivityPanelPresenter {
    vm: IActivityPanelViewModel;
    toggle(): void;
    show(): void;
    hide(): void;
}

export const ActivityPanelPresenter = createAbstraction<IActivityPanelPresenter>(
    "ActivityLog/ActivityPanelPresenter"
);

export namespace ActivityPanelPresenter {
    export type Interface = IActivityPanelPresenter;
    export type ViewModel = IActivityPanelViewModel;
}

/**
 * Whether the activity panel is open.
 *
 * A presenter rather than component state because two places need it and neither owns the other:
 * the toggle lives in the entry header, and the panel lives in the form content. Following
 * `RevisionsListPresenter`, which solves the same split for the revisions drawer.
 *
 * Closed by default. The panel takes width away from the form, so a reader who has not asked for
 * history should not have to dismiss it — and unlike the revisions drawer this is not a modal, so
 * leaving it open would quietly narrow every entry form in the installation.
 */
class ActivityPanelPresenterImpl implements IActivityPanelPresenter {
    private opened = false;

    constructor() {
        makeAutoObservable(this);
    }

    get vm() {
        return { open: this.opened };
    }

    toggle() {
        this.opened = !this.opened;
    }

    show() {
        this.opened = true;
    }

    hide() {
        this.opened = false;
    }
}

export const ActivityPanelPresenterImplementation = ActivityPanelPresenter.createImplementation({
    implementation: ActivityPanelPresenterImpl,
    dependencies: []
});
