import cloneDeep from "lodash/cloneDeep";
import orderBy from "lodash/orderBy";
import { makeAutoObservable, runInAction } from "mobx";

import { QueryObjectMapper, QueryObjectDTO, Loading, QueryObjectRaw } from "./domain";
import { GatewayInterface } from "./gateways";
import { ListSort } from "~/types";

export class QueryObjectRepository {
    private gateway: GatewayInterface;
    private _loading: Loading;
    private static instance: QueryObjectRepository;
    private readonly sort: ListSort;
    private _filters: QueryObjectDTO[] = [];
    public readonly modelId: string;

    constructor(gateway: GatewayInterface, modelId: string) {
        this.gateway = gateway;
        this._loading = new Loading();
        this.modelId = modelId;
        this.sort = ["createdOn_DESC"];
        makeAutoObservable(this);
    }

    static getInstance(gateway: GatewayInterface, modelId: string) {
        if (!QueryObjectRepository.instance) {
            QueryObjectRepository.instance = new QueryObjectRepository(gateway, modelId);
        }
        return QueryObjectRepository.instance;
    }

    get filters() {
        return cloneDeep(this._filters);
    }

    get loading() {
        return {
            isLoading: this._loading.isLoading,
            loadingLabel: this._loading.loadingLabel,
            message: this._loading.feedback
        };
    }

    private async runWithLoading<T>(
        action: Promise<T>,
        loadingLabel?: string,
        successMessage?: string,
        failureMessage?: string
    ) {
        return await this._loading.runCallbackWithLoading(
            action,
            loadingLabel,
            successMessage,
            failureMessage
        );
    }

    async listFilters() {
        const response = await this.runWithLoading<QueryObjectRaw[]>(
            this.gateway.list(this.modelId),
            "Listing filters"
        );

        if (!response) {
            return;
        }

        runInAction(() => {
            this._filters = response.map(filter => QueryObjectMapper.toDTO(filter));
        });
    }

    async getFilterById(id: string) {
        const filterInCache = this.filters.find(filter => filter.id === id);

        if (filterInCache) {
            return cloneDeep(filterInCache);
        }

        const response = await this.runWithLoading<QueryObjectRaw>(this.gateway.get(id));

        if (!response) {
            return;
        }

        const filterDTO = QueryObjectMapper.toDTO(response);
        runInAction(() => {
            this._filters = this.sortFilters([filterDTO, ...this.filters]);
        });

        return cloneDeep(filterDTO);
    }

    async createFilter(filter: QueryObjectDTO) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...rawFilter } = QueryObjectMapper.toRaw(filter);

        const response = await this.runWithLoading<QueryObjectRaw>(
            this.gateway.create(rawFilter),
            "Creating filter",
            `Filter "${rawFilter.name}" was successfully created.`
        );

        if (!response) {
            return;
        }

        const filterDTO = QueryObjectMapper.toDTO(response);
        runInAction(() => {
            this._filters = this.sortFilters([filterDTO, ...this.filters]);
        });

        return cloneDeep(filterDTO);
    }

    async updateFilter(filter: QueryObjectDTO) {
        const rawFilter = QueryObjectMapper.toRaw(filter);
        const response = await this.runWithLoading<QueryObjectRaw>(
            this.gateway.update(rawFilter),
            "Updating filter",
            `Filter "${rawFilter.name}" was successfully updated.`
        );

        if (!response) {
            return;
        }

        const filterIndex = this.filters.findIndex(f => f.id === filter.id);
        if (filterIndex > -1) {
            const filterDTO = QueryObjectMapper.toDTO(response);

            runInAction(() => {
                this._filters = this.sortFilters([
                    ...this.filters.slice(0, filterIndex),
                    {
                        ...this.filters[filterIndex],
                        ...filterDTO
                    },
                    ...this.filters.slice(filterIndex + 1)
                ]);
            });
        }
    }

    async deleteFilter(id: string) {
        const filter = await this.getFilterById(id);

        if (!filter) {
            return;
        }

        const response = await this.runWithLoading<boolean>(
            this.gateway.delete(id),
            "Deleting filter",
            `Filter "${filter.name}" was successfully deleted.`
        );

        if (response) {
            runInAction(() => {
                this._filters = this.sortFilters(this._filters.filter(filter => filter.id !== id));
            });
        }
    }

    private sortFilters(filters: QueryObjectDTO[]) {
        const sortByFields = this.sort.map(sort => {
            const [field, order] = sort.split("_");
            return { field, order: order.toLowerCase() as "asc" | "desc" };
        });

        return orderBy(
            filters,
            sortByFields.map(sort => sort.field),
            sortByFields.map(sort => sort.order)
        );
    }
}
