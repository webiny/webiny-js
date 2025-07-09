import { reaction, toJS } from "mobx";
import { ILoadingRepository, MetaMapper, MetaRepository } from "@webiny/app-utils";
import type {
    IListPagesRepository,
    IListPagesRepositoryParams
} from "~/features/pages/listPages/IListPagesRepository.js";
import { type IListCache, Page } from "~/domains/Page/index.js";
import type { IListPagesGateway } from "~/features/pages/listPages/IListPagesGateway.js";
import { ParamsRepository, type ParamsRepositoryGetVariables } from "~/domains/Params/index.js";
import { loadingActions } from "~/constants.js";

export class ListPagesRepository implements IListPagesRepository {
    private cache: IListCache<Page>;
    private loading: ILoadingRepository;
    private meta: MetaRepository;
    private params: ParamsRepository;
    private gateway: IListPagesGateway;

    constructor(
        cache: IListCache<Page>,
        meta: MetaRepository,
        loading: ILoadingRepository,
        params: ParamsRepository,
        gateway: IListPagesGateway
    ) {
        this.cache = cache;
        this.meta = meta;
        this.loading = loading;
        this.params = params;
        this.gateway = gateway;

        reaction(
            () => toJS(this.params.get()),
            params => {
                this.query(params);
            }
        );
    }

    async execute(params?: IListPagesRepositoryParams) {
        if (params) {
            this.params.setAll(params);
        }
    }

    private async query(params: ParamsRepositoryGetVariables) {
        if (params?.after) {
            await this.loading.runCallBack(
                (async () => {
                    const { pages, meta } = await this.gateway.execute(params);
                    this.cache.addItems(pages.map(page => Page.create(page)));
                    await this.meta.set(MetaMapper.toDto(meta));
                })(),
                loadingActions.listMore
            );
        } else {
            await this.loading.runCallBack(
                (async () => {
                    const { pages, meta } = await this.gateway.execute(params);
                    this.cache.clear();
                    this.cache.addItems(pages.map(page => Page.create(page)));
                    await this.meta.set(MetaMapper.toDto(meta));
                })(),
                loadingActions.list
            );
        }
    }
}
