import { ApolloClient } from "apollo-client";
import { makeAutoObservable, runInAction } from "mobx";

import { Mode, QueryObjectMapper, QueryObjectDTO } from "./domains";
import { FiltersGraphQL } from "./gateways";

export class QueryObjectRepository {
    private gateway: FiltersGraphQL;
    private static instance: QueryObjectRepository;
    modelId: string;
    filters: QueryObjectDTO[] = [];
    selected: QueryObjectDTO | undefined = undefined;
    mode: Mode = Mode.CREATE;

    constructor(client: ApolloClient<any>, modelId: string) {
        this.gateway = new FiltersGraphQL(client); // TODO: inject the gateway
        this.modelId = modelId;
        makeAutoObservable(this);
    }

    static getInstance(client: ApolloClient<any>, modelId: string) {
        if (!QueryObjectRepository.instance) {
            QueryObjectRepository.instance = new QueryObjectRepository(client, modelId);
        }
        return QueryObjectRepository.instance;
    }

    async listFilters() {
        const rawFilters = await this.gateway.list(this.modelId);

        runInAction(() => {
            this.filters = rawFilters.map(filter => QueryObjectMapper.toDTO(filter));
        });
    }

    async createFilter(filter: QueryObjectDTO) {
        const { id: _, ...rawFilter } = QueryObjectMapper.toRaw(filter);
        const response = await this.gateway.create(rawFilter);
        const filterDTO = QueryObjectMapper.toDTO(response);

        if (response) {
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

    setSelected(id?: string) {
        this.selected = id ? this.filters.find(filter => filter.id === id) : undefined;
    }
}
