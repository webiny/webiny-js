import { makeAutoObservable } from "mobx";
import orderBy from "lodash/orderBy.js";
import { loadingActions } from "~/constants.js";
import { GetPageRevisionsUseCase } from "~/features/pages/getPageRevisions/abstractions.js";
import {
    PageRevisionsCache,
    WbPageLoadingRepository,
    WbPageRevisionsLoadingRepository
} from "~/features/pages/shared/abstractions.js";
import { RevisionListPresenter as PresenterAbstraction } from "./abstractions.js";

const MUTATION_ACTIONS = [
    loadingActions.createRevisionFrom,
    loadingActions.delete,
    loadingActions.publish,
    loadingActions.unpublish
];

class RevisionListPresenterImpl implements PresenterAbstraction.Interface {
    private entryId: string | undefined = undefined;

    constructor(
        private revisionsCache: PageRevisionsCache.Interface,
        private loadingRepository: WbPageRevisionsLoadingRepository.Interface,
        private pageLoadingRepository: WbPageLoadingRepository.Interface,
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

        return orderBy(revisions, ["savedOn"], ["desc"]);
    };

    private getIsLoading = () => {
        return Boolean(this.loadingRepository.isLoading(loadingActions.get));
    };

    /**
     * Only the actions reachable from the revisions list are watched. The `WbPage` namespace is
     * shared with the pages table, so `hasLoading()` would also react to listing and fetching.
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
        GetPageRevisionsUseCase
    ]
});
