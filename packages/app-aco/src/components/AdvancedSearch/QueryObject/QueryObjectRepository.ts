import orderBy from "lodash/orderBy";
import { makeAutoObservable, runInAction } from "mobx";

import { QueryObjectMapper, QueryObjectDTO } from "./domains";
import { GatewayInterface } from "./gateways";
import { ListSort } from "~/types";

export class QueryObjectRepository {
    private gateway: GatewayInterface;
    private static instance: QueryObjectRepository;
    private readonly sort: ListSort;
    modelId: string;
    filters: QueryObjectDTO[] = [];

    constructor(gateway: GatewayInterface, modelId: string) {
        this.gateway = gateway;
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

    async listFilters() {
        try {
            const rawFilters = await this.gateway.list(this.modelId);
            runInAction(() => {
                this.filters = rawFilters.map(filter => QueryObjectMapper.toDTO(filter));
            });
        } catch (e) {
            throw new Error(e.message);
        }
    }

    async getFilterById(id: string) {
        const filterInCache = this.filters.find(filter => filter.id === id);

        if (filterInCache) {
            return filterInCache;
        }

        const response = await this.gateway.get(id);
        const filterDTO = QueryObjectMapper.toDTO(response);

        runInAction(() => {
            this.filters = this.sortFilters([filterDTO, ...this.filters]);
        });

        return filterDTO;
    }

    async createFilter(filter: QueryObjectDTO) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...rawFilter } = QueryObjectMapper.toRaw(filter);
        const response = await this.gateway.create(rawFilter);

        if (response) {
            const filterDTO = QueryObjectMapper.toDTO(response);
            runInAction(() => {
                this.filters = [filterDTO, ...this.filters];
            });
        }
    }

    async updateFilter(filter: QueryObjectDTO) {
        const rawFilter = QueryObjectMapper.toRaw(filter);
        const response = await this.gateway.update(rawFilter);

        if (response) {
            const filterIndex = this.filters.findIndex(f => f.id === filter.id);

            if (filterIndex > -1) {
                const filterDTO = QueryObjectMapper.toDTO(response);

                runInAction(() => {
                    this.filters = [
                        ...this.filters.slice(0, filterIndex),
                        {
                            ...this.filters[filterIndex],
                            ...filterDTO
                        },
                        ...this.filters.slice(filterIndex + 1)
                    ];
                });
            }
        }
    }

    async deleteFilter(id: string) {
        const response = await this.gateway.delete(id);

        if (response) {
            runInAction(() => {
                this.filters = this.filters.filter(filter => filter.id !== id);
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
