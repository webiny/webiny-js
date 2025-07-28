import type {
    IListRedirectsRepository,
    LoadRedirectsRepositoryParams
} from "~/features/redirects/loadRedirects/IListRedirectsRepository.js";
import { type IListCache, Redirect } from "~/domain/Redirect/index.js";
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
    IListRedirectsGateway,
    ListRedirectsGatewayParams
} from "~/features/redirects/loadRedirects/IListRedirectsGateway.js";
import type { ISearchRepository } from "~/domain/Search/index.js";
import { loadingActions } from "~/constants.js";
import type { IFilterRepository } from "~/domain/Filter/index.js";

export class ListRedirectsRepository implements IListRedirectsRepository {
    private redirects: IListCache<Redirect>;
    private loading: ILoadingRepository;
    private meta: IMetaRepository;
    private params: IParamsRepository;
    private search: ISearchRepository;
    private sorting: ISortingRepository;
    private filter: IFilterRepository;
    private gateway: IListRedirectsGateway;

    constructor(
        cache: IListCache<Redirect>,
        loading: ILoadingRepository,
        meta: IMetaRepository,
        params: IParamsRepository,
        search: ISearchRepository,
        sorting: ISortingRepository,
        filter: IFilterRepository,
        gateway: IListRedirectsGateway
    ) {
        this.redirects = cache;
        this.loading = loading;
        this.meta = meta;
        this.params = params;
        this.search = search;
        this.sorting = sorting;
        this.filter = filter;
        this.gateway = gateway;
    }

    async loadRedirects({ resetSearch, ...params }: LoadRedirectsRepositoryParams) {
        await this.params.set(params);
        await this.filter.reset();
        await this.meta.set({
            totalCount: 0,
            cursor: null,
            hasMoreItems: false
        });

        if (resetSearch) {
            await this.search.set("");
        }

        await this.fetchAndSetRedirects(loadingActions.list);
    }

    async loadMoreRedirects() {
        const after = this.meta.get().cursor;
        if (!after) {
            return;
        }
        await this.fetchAndAddRedirects(loadingActions.listMore);
    }

    async searchRedirects(query: string, where: Record<string, any>) {
        await this.params.set({ where });
        await this.search.set(query);
        await this.fetchAndSetRedirects(loadingActions.list);
    }

    async sortRedirects(sorts: Sorting[]) {
        this.sorting.set(sorts);
        await this.fetchAndSetRedirects(loadingActions.list);
    }

    async filterRedirects(filters: Record<string, any>, where: Record<string, any>) {
        await this.params.set({ where });
        await this.filter.set(filters);
        await this.fetchAndSetRedirects(loadingActions.list);
    }

    private async fetchAndSetRedirects(action: string) {
        const callback = async () => {
            const { redirects, meta } = await this.gateway.execute(this.getGatewayParams());
            this.redirects.clear();
            this.redirects.addItems(redirects.map(redirect => Redirect.create(redirect)));
            await this.meta.set(MetaMapper.toDto(meta));
        };
        await this.loading.runCallBack(callback(), action);
    }

    private async fetchAndAddRedirects(action: string) {
        const callback = async () => {
            const { redirects, meta } = await this.gateway.execute(this.getGatewayParams());
            this.redirects.addItems(redirects.map(redirect => Redirect.create(redirect)));
            await this.meta.set(MetaMapper.toDto(meta));
        };
        await this.loading.runCallBack(callback(), action);
    }

    private getGatewayParams(): ListRedirectsGatewayParams {
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
