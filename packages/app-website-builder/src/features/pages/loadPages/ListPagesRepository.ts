import type {
    IListPagesRepository,
    LoadPagesRepositoryParams
} from "~/features/pages/loadPages/IListPagesRepository.js";
import { type IListCache, Page } from "~/domain/Page/index.js";
import {
    type ILoadingRepository,
    type IMetaRepository,
    type ISortingRepository,
    MetaMapper,
    Sorting,
    SortingMapper
} from "@webiny/app-utils";
import type { IParamsRepository } from "~/domain/Params/index.js";
import type {
    IListPagesGateway,
    ListPagesGatewayParams
} from "~/features/pages/loadPages/IListPagesGateway.js";
import type { ISearchRepository } from "~/domain/Search/index.js";
import { loadingActions } from "~/constants.js";
import type { IFilterRepository } from "~/domain/Filter/index.js";

export class ListPagesRepository implements IListPagesRepository {
    private pages: IListCache<Page>;
    private loading: ILoadingRepository;
    private meta: IMetaRepository;
    private params: IParamsRepository;
    private search: ISearchRepository;
    private sorting: ISortingRepository;
    private filter: IFilterRepository;
    private gateway: IListPagesGateway;

    constructor(
        cache: IListCache<Page>,
        loading: ILoadingRepository,
        meta: IMetaRepository,
        params: IParamsRepository,
        search: ISearchRepository,
        sorting: ISortingRepository,
        filter: IFilterRepository,
        gateway: IListPagesGateway
    ) {
        this.pages = cache;
        this.loading = loading;
        this.meta = meta;
        this.params = params;
        this.search = search;
        this.sorting = sorting;
        this.filter = filter;
        this.gateway = gateway;
    }

    async loadPages(params: LoadPagesRepositoryParams) {
        await this.params.set(params);
        await this.search.set("");
        await this.filter.reset();
        await this.meta.set({
            totalCount: 0,
            cursor: null,
            hasMoreItems: false
        });

        const callback = async () => {
            const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
            this.pages.clear();
            this.pages.addItems(pages.map(page => Page.create(page)));
            await this.meta.set(MetaMapper.toDto(meta));
        };

        await this.loading.runCallBack(callback(), loadingActions.list);
    }

    async loadMorePages() {
        const after = this.meta.get().cursor;

        if (!after) {
            return;
        }

        const callback = async () => {
            const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
            this.pages.addItems(pages.map(page => Page.create(page)));
            await this.meta.set(MetaMapper.toDto(meta));
        };

        await this.loading.runCallBack(callback(), loadingActions.listMore);
    }

    async searchPages(query: string, where: Record<string, any>) {
        await this.params.set({ where });
        await this.search.set(query);

        const callback = async () => {
            const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
            this.pages.clear();
            this.pages.addItems(pages.map(page => Page.create(page)));
            await this.meta.set(MetaMapper.toDto(meta));
        };

        await this.loading.runCallBack(callback(), loadingActions.list);
    }

    async sortPages(sorts: Sorting[]) {
        this.sorting.set(sorts);

        const callback = async () => {
            const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
            this.pages.clear();
            this.pages.addItems(pages.map(page => Page.create(page)));
            await this.meta.set(MetaMapper.toDto(meta));
        };

        await this.loading.runCallBack(callback(), loadingActions.list);
    }

    async filterPages(filters: Record<string, any>, where: Record<string, any>) {
        await this.params.set({ where });
        await this.filter.set(filters);

        const callback = async () => {
            const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
            this.pages.clear();
            this.pages.addItems(pages.map(page => Page.create(page)));
            await this.meta.set(MetaMapper.toDto(meta));
        };

        await this.loading.runCallBack(callback(), loadingActions.list);
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
