import { makeAutoObservable, runInAction } from "mobx";

import { QueryObjectMapper, QueryObjectDTO } from "./domains";
import { IQueryObjectGateway } from "./gateways";

const instances: Map<string, QueryObjectRepository> = new Map();

export class QueryObjectRepository {
    private readonly gateway: IQueryObjectGateway;
    readonly modelId: string;
    filters: QueryObjectDTO[] = [];

    constructor(gateway: IQueryObjectGateway, modelId: string) {
        this.gateway = gateway;
        this.modelId = modelId;
        makeAutoObservable(this);
    }

    static getInstance(gateway: IQueryObjectGateway, modelId: string) {
        if (!instances.has(modelId)) {
            instances.set(modelId, new QueryObjectRepository(gateway, modelId));
        }
        return instances.get(modelId) as QueryObjectRepository;
    }

    static clearInstances() {
        instances.clear();
    }

    async getFilterById(id: string) {
        const filter = this.filters.find(filter => filter.id === id);
        if (filter) {
            return filter;
        }

        try {
            const rawFilter = await this.gateway.getById(id);
            return QueryObjectMapper.toDTO(rawFilter);
        } catch (e) {
            throw new Error(e.message);
        }
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
}
