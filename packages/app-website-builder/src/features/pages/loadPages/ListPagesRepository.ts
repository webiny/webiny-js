import { ListPagesRepository as RepositoryAbstraction, ListPagesGateway } from "./abstractions.js";
import type { LoadPagesRepositoryParams, ListPagesGatewayParams } from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import type { Sorting } from "@webiny/app-utils";
import { MetaMapper, SortingMapper } from "@webiny/app-utils";
import { loadingActions } from "~/constants.js";
import {
    PageListCache,
    WbPageLoadingRepository,
    WbPageMetaRepository,
    WbPageParamsRepository,
    WbPageSearchRepository,
    WbPageSortingRepository,
    WbPageFilterRepository
} from "~/features/pages/shared/abstractions.js";

class ListPagesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pages: PageListCache.Interface,
        private loading: WbPageLoadingRepository.Interface,
        private meta: WbPageMetaRepository.Interface,
        private params: WbPageParamsRepository.Interface,
        private search: WbPageSearchRepository.Interface,
        private sorting: WbPageSortingRepository.Interface,
        private filter: WbPageFilterRepository.Interface,
        private gateway: ListPagesGateway.Interface
    ) {}

    async loadPages({ resetSearch, ...params }: LoadPagesRepositoryParams) {
        await this.params.set(params);
        await this.filter.reset();
        await this.meta.set({ totalCount: 0, cursor: null, hasMoreItems: false });

        if (resetSearch) {
            await this.search.set("");
        }

        await this.fetchAndSetPages(loadingActions.list);
    }

    async loadMorePages() {
        const after = this.meta.get().cursor;
        if (!after) {
            return;
        }
        await this.fetchAndAddPages(loadingActions.listMore);
    }

    async searchPages(query: string, where: Record<string, any>) {
        await this.params.set({ where });
        await this.search.set(query);
        await this.fetchAndSetPages(loadingActions.list);
    }

    async sortPages(sorts: Sorting[]) {
        this.sorting.set(sorts);
        await this.fetchAndSetPages(loadingActions.list);
    }

    async filterPages(filters: Record<string, any>, where: Record<string, any>) {
        await this.params.set({ where });
        await this.filter.set(filters);
        await this.fetchAndSetPages(loadingActions.list);
    }

    private async fetchAndSetPages(action: string) {
        const callback = async () => {
            const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
            this.pages.clear();
            this.pages.addItems(pages.map(page => Page.create(page)));
            await this.meta.set(MetaMapper.toDto(meta));
        };
        await this.loading.runCallBack(callback(), action);
    }

    private async fetchAndAddPages(action: string) {
        const callback = async () => {
            const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
            this.pages.addItems(pages.map(page => Page.create(page)));
            await this.meta.set(MetaMapper.toDto(meta));
        };
        await this.loading.runCallBack(callback(), action);
    }

    private getGatewayParams(): ListPagesGatewayParams {
        const where = {
            ...this.params.get().where,
            ...this.filter.get()
        };

        return {
            where,
            limit: 50,
            search: this.search.get(),
            sort: this.sorting.get().map(sort => SortingMapper.fromDTOtoDb(sort)),
            after: this.meta.get().cursor ?? undefined
        };
    }
}

export const ListPagesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListPagesRepositoryImpl,
    dependencies: [
        PageListCache,
        WbPageLoadingRepository,
        WbPageMetaRepository,
        WbPageParamsRepository,
        WbPageSearchRepository,
        WbPageSortingRepository,
        WbPageFilterRepository,
        ListPagesGateway
    ]
});
