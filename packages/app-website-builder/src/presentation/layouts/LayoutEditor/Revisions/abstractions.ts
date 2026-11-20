import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "~/features/layouts/index.js";

/**
 * A revision plus what may be done to it, so the view never derives policy.
 */
export interface ILayoutRevisionItemVm {
    revision: Layout;
    // e.g. "v2 (Draft)".
    label: string;
    canCreateFrom: boolean;
    canEdit: boolean;
    canPublish: boolean;
    canUnpublish: boolean;
    canDelete: boolean;
}

// The revision an action runs on.
export type LayoutRevisionRef = Pick<Layout, "id" | "version">;

export interface ILayoutRevisionsVm {
    // Newest first.
    revisions: ILayoutRevisionItemVm[];
    loading: boolean;
    // Whether an action is running.
    mutating: boolean;
    drawerOpen: boolean;
}

/**
 * The revisions of the layout open in the layout editor: listed in the top bar menu and the revisions
 * drawer, and published, unpublished, copied into a new revision or deleted from there. Each action
 * notifies about its outcome (a layout in use can't be unpublished, which is explained).
 */
export interface ILayoutRevisionsPresenter {
    readonly vm: ILayoutRevisionsVm;
    // Load the revisions of a layout entry. Loading the same entry again is a no-op.
    init(entryId: string): void;
    openDrawer(open: boolean): void;
    // Each resolves with the outcome, or `null` / `false` if it failed.
    publish(revision: LayoutRevisionRef): Promise<Layout | null>;
    unpublish(revision: LayoutRevisionRef): Promise<Layout | null>;
    createRevisionFrom(revision: LayoutRevisionRef): Promise<Layout | null>;
    deleteRevision(revision: LayoutRevisionRef): Promise<boolean>;
}

export const LayoutRevisionsPresenter = createAbstraction<ILayoutRevisionsPresenter>(
    "WebsiteBuilder/LayoutRevisionsPresenter"
);

export namespace LayoutRevisionsPresenter {
    export type Interface = ILayoutRevisionsPresenter;
    export type ViewModel = ILayoutRevisionsVm;
    export type ItemViewModel = ILayoutRevisionItemVm;
    export type RevisionRef = LayoutRevisionRef;
}
