import cloneDeep from "lodash/cloneDeep";
import { makeAutoObservable, runInAction } from "mobx";
import { mdbid } from "@webiny/utils";

import { FilterDTO, FilterMapper, FilterRaw, Loading, Sorter } from "../domain";
import { FiltersGatewayInterface } from "../gateways";

export class FilterRepository {
    private gateway: FiltersGatewayInterface;
    private sorter: Sorter<FilterDTO>;
    private _loading: Loading;
    private static instance: FilterRepository;
    private _filters: FilterDTO[] = [];
    public readonly namespace: string;

    constructor(gateway: FiltersGatewayInterface, namespace: string) {
        this.gateway = gateway;
        this._loading = new Loading();
        this.namespace = namespace;
        this.sorter = new Sorter(["createdOn_DESC"]);
        makeAutoObservable(this);
    }

    static getInstance(gateway: FiltersGatewayInterface, namespace: string) {
        if (!FilterRepository.instance) {
            FilterRepository.instance = new FilterRepository(gateway, namespace);
        }
        return FilterRepository.instance;
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
        const response = await this.runWithLoading<FilterRaw[]>(
            this.gateway.list(this.namespace),
            "Listing filters"
        );

        if (!response) {
            return;
        }

        runInAction(() => {
            this._filters = this.sorter.sort(response.map(filter => FilterMapper.toDTO(filter)));
        });
    }

    async getFilterById(id: string) {
        const filterInCache = this.filters.find(filter => filter.id === id);

        if (filterInCache) {
            return cloneDeep(filterInCache);
        }

        const response = await this.runWithLoading<FilterRaw>(this.gateway.get(id));

        if (!response) {
            return;
        }

        const filterDTO = FilterMapper.toDTO(response);
        runInAction(() => {
            this._filters = this.sorter.sort([filterDTO, ...this.filters]);
        });

        return cloneDeep(filterDTO);
    }

    async createFilter(filter: FilterDTO) {
        const rawFilter = FilterMapper.toRaw(filter);
        const id = mdbid();

        const response = await this.runWithLoading<FilterRaw>(
            this.gateway.create({ ...rawFilter, id }),
            "Creating filter",
            `Filter "${rawFilter.name}" was successfully created.`
        );

        if (!response) {
            return;
        }

        const filterDTO = FilterMapper.toDTO(response);
        runInAction(() => {
            this._filters = this.sorter.sort([filterDTO, ...this.filters]);
        });

        return cloneDeep(filterDTO);
    }

    async updateFilter(filter: FilterDTO) {
        const rawFilter = FilterMapper.toRaw(filter);
        const response = await this.runWithLoading<FilterRaw>(
            this.gateway.update(rawFilter),
            "Updating filter",
            `Filter "${rawFilter.name}" was successfully updated.`
        );

        if (!response) {
            return;
        }

        const filterIndex = this.filters.findIndex(f => f.id === filter.id);
        if (filterIndex > -1) {
            const filterDTO = FilterMapper.toDTO(response);

            runInAction(() => {
                this._filters = this.sorter.sort([
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
                this._filters = this.sorter.sort(this._filters.filter(filter => filter.id !== id));
            });
        }
    }
}
