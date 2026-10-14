import { makeAutoObservable } from "mobx";
import orderBy from "lodash/orderBy.js";
import { loadingActions, WbPageStatus } from "~/constants.js";
import { GetPageRevisionsUseCase } from "~/features/pages/getPageRevisions/abstractions.js";
import {
    PageRevisionsCache,
    WbPageLoadingRepository,
    WbPageRevisionsLoadingRepository
} from "~/features/pages/shared/abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import type { PageRevision } from "~/domain/PageRevision/PageRevision.js";
import { RevisionListPresenter as PresenterAbstraction } from "./abstractions.js";

/**
 * Only actions that run straight from the menu need the overlay. Delete, publish and unpublish
 * are confirmed through a dialog, which shows its own loader while the action runs.
 */
const MUTATION_ACTIONS = [loadingActions.createRevisionFrom];

class RevisionListPresenterImpl implements PresenterAbstraction.Interface {
    private entryId: string | undefined = undefined;

    constructor(
        private revisionsCache: PageRevisionsCache.Interface,
        private loadingRepository: WbPageRevisionsLoadingRepository.Interface,
        private pageLoadingRepository: WbPageLoadingRepository.Interface,
        private permissions: WbPermissions.Interface,
        private getPageRevisions: GetPageRevisionsUseCase.Interface
    ) {
        makeAutoObservable(this);
    }

    public init(params: PresenterAbstraction.Init) {
        if (this.entryId === params.entryId) {
            return;
        }

        this.entryId = params.entryId;
        void this.getPageRevisions.execute({ entryId: params.entryId });
    }

    public get vm(): PresenterAbstraction.ViewModel {
        const revisions = this.getRevisions();
        const isLoading = this.getIsLoading();

        return {
            revisions,
            isLoading,
            isMutating: this.getIsMutating(),
            isEmpty: !isLoading && revisions.length === 0
        };
    }

    private getRevisions = () => {
        if (!this.entryId) {
            return [];
        }

        // The cache is shared across pages, so it can hold revisions of previously opened pages.
        const revisions = this.revisionsCache
            .getItems()
            .filter(revision => revision.entryId === this.entryId);

        return orderBy(revisions, ["savedOn"], ["desc"]).map(revision => this.getItemVm(revision));
    };

    private getItemVm = (revision: PageRevision): PresenterAbstraction.ItemViewModel => {
        const canEdit = this.permissions.canEdit("page", revision);

        return {
            revision,
            canCreateFrom: canEdit,
            // A locked revision has already been published, so its content can no longer change.
            canEdit: !revision.locked && canEdit,
            canPublish:
                revision.status !== WbPageStatus.Published && this.permissions.canPublish("page"),
            canUnpublish:
                revision.status === WbPageStatus.Published && this.permissions.canUnpublish("page"),
            // Deleting a published or locked revision is allowed, matching the API.
            canDelete: this.permissions.canDelete("page", revision)
        };
    };

    private getIsLoading = () => {
        return Boolean(this.loadingRepository.isLoading(loadingActions.get));
    };

    /**
     * Watching named actions rather than `hasLoading()`: the `WbPage` namespace is shared with
     * the pages table, so that would also react to listing and fetching.
     */
    private getIsMutating = () => {
        return MUTATION_ACTIONS.some(action => this.pageLoadingRepository.isLoading(action));
    };
}

export const RevisionListPresenter = PresenterAbstraction.createImplementation({
    implementation: RevisionListPresenterImpl,
    dependencies: [
        PageRevisionsCache,
        WbPageRevisionsLoadingRepository,
        WbPageLoadingRepository,
        WbPermissions,
        GetPageRevisionsUseCase
    ]
});
