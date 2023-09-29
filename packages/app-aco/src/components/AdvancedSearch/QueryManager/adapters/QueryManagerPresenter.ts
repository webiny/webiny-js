import { makeAutoObservable, runInAction } from "mobx";
import { ApolloClient } from "apollo-client";
import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryBuilder/domain";
import { FiltersGraphQL } from "../gateways";
import { QueryObjectMapper } from "~/components/AdvancedSearch/QueryManager/domain";

export interface IQueryManagerPresenter {
    getViewModel: () => QueryManagerViewModel;
    listFilters: () => void;
    createFilter: (filter: Omit<QueryObjectDTO, "id">) => void;
    updateFilter: (filter: Omit<QueryObjectDTO, "id">) => void;
    deleteFilter: (id: string) => void;
}

export interface QueryManagerViewModel {
    filters: QueryObjectDTO[];
}

export class QueryManagerPresenter implements IQueryManagerPresenter {
    private gateway: FiltersGraphQL;
    private filters: QueryObjectDTO[] = [];
    private readonly modelId: string;
    selected: undefined | QueryObjectDTO;

    constructor(client: ApolloClient<any>, modelId: string) {
        this.gateway = new FiltersGraphQL(client);
        this.modelId = modelId;
        this.selected = undefined;
        makeAutoObservable(this);
    }

    async listFilters() {
        const rawFilters = await this.gateway.list(this.modelId);

        runInAction(() => {
            this.filters = rawFilters.map(filter => QueryObjectMapper.toDTO(filter));
        });
    }

    async createFilter(filter: any) {
        const rawFilter = QueryObjectMapper.toRaw(filter);
        const response = await this.gateway.create(rawFilter);
        const filterDTO = QueryObjectMapper.toDTO(response);

        if (response) {
            this.filters = [...this.filters, filterDTO];
        }
    }

    async updateFilter(filter: any) {
        const rawFilter = QueryObjectMapper.toRaw(filter);
        const response = await this.gateway.update(rawFilter);

        if (response) {
            const filterIndex = this.filters.findIndex(f => f.id === filter.id);

            if (filterIndex > -1) {
                const filterDTO = QueryObjectMapper.toDTO(response);
                this.filters = [
                    ...this.filters.slice(0, filterIndex),
                    {
                        ...this.filters[filterIndex],
                        ...filterDTO
                    },
                    ...this.filters.slice(filterIndex + 1)
                ];
            }
        }
    }

    async deleteFilter(id: string) {
        const response = await this.gateway.delete(id);

        if (response) {
            this.filters = this.filters.filter(filter => filter.id !== id);
        }
    }

    setSelected(id?: string) {
        this.selected = id ? this.filters.find(filter => filter.id === id) : undefined;
    }

    getViewModel() {
        return {
            filters: this.filters,
            selected: this.selected
        };
    }
}
