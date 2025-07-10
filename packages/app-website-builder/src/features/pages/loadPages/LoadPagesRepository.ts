import type {
    ILoadPagesRepository,
    LoadPagesRepositoryParams
} from "~/features/pages/loadPages/ILoadPagesRepository.js";
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

export class LoadPagesRepository implements ILoadPagesRepository {
    private pages: IListCache<Page>;
    private loading: ILoadingRepository;
    private meta: IMetaRepository;
    private params: IParamsRepository;
    private search: ISearchRepository;
    private sorting: ISortingRepository;
    private gateway: IListPagesGateway;

    constructor(
        cache: IListCache<Page>,
        loading: ILoadingRepository,
        meta: IMetaRepository,
        params: IParamsRepository,
        search: ISearchRepository,
        sorting: ISortingRepository,
        gateway: IListPagesGateway
    ) {
        this.pages = cache;
        this.loading = loading;
        this.meta = meta;
        this.params = params;
        this.search = search;
        this.sorting = sorting;
        this.gateway = gateway;
    }

    async loadPages(params: LoadPagesRepositoryParams) {
        this.params.set(params);
        await this.search.set("");
        await this.meta.set({
            totalCount: 0,
            cursor: null,
            hasMoreItems: false
        });

        await this.loading.runCallBack(
            (async () => {
                const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
                this.pages.clear();
                this.pages.addItems(pages.map(page => Page.create(page)));
                await this.meta.set(MetaMapper.toDto(meta));
            })(),
            loadingActions.list
        );
    }

    async loadMorePages() {
        const after = this.meta.get().cursor;

        if (!after) {
            return;
        }

        await this.loading.runCallBack(
            (async () => {
                const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
                this.pages.addItems(pages.map(page => Page.create(page)));
                await this.meta.set(MetaMapper.toDto(meta));
            })(),
            loadingActions.listMore
        );
    }

    async searchPages(query: string, where: Record<string, any>) {
        this.params.set({ where });
        await this.search.set(query);

        await this.loading.runCallBack(
            (async () => {
                const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
                this.pages.clear();
                this.pages.addItems(pages.map(page => Page.create(page)));
                await this.meta.set(MetaMapper.toDto(meta));
            })(),
            loadingActions.list
        );
    }

    async sortPages(sorts: Sorting[]) {
        this.sorting.set(sorts);

        await this.loading.runCallBack(
            (async () => {
                const { pages, meta } = await this.gateway.execute(this.getGatewayParams());
                this.pages.clear();
                this.pages.addItems(pages.map(page => Page.create(page)));
                await this.meta.set(MetaMapper.toDto(meta));
            })(),
            loadingActions.list
        );
    }

    private getGatewayParams(): ListPagesGatewayParams {
        return {
            where: this.params.get().where,
            limit: 50,
            search: this.search.get(),
            sort: this.sorting.get().map(sort => SortingMapper.fromDTOtoDb(sort)),
            after: this.meta.get().cursor ?? undefined
        };
    }
}
