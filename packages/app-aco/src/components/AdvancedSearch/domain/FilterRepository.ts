import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { mdbid } from "@webiny/utils";
import type { FilterDTO } from "../domain/index.js";
import { FilterMapper, Loading, Sorter } from "../domain/index.js";
import type { FiltersGatewayInterface } from "../gateways/index.js";

export class FilterRepository {
    private gateway: FiltersGatewayInterface;
    private sorter: Sorter<FilterDTO>;
    private loading: Loading;
    private filters;
    public readonly namespace: string;

    constructor(gateway: FiltersGatewayInterface, namespace: string) {
        this.gateway = gateway;
        this.loading = new Loading();
        this.namespace = namespace;
        this.filters = observable.array<FilterDTO>([]);
        this.sorter = new Sorter(["createdOn_DESC"]);
        makeAutoObservable(this);
    }

    getFilters() {
        return structuredClone(toJS(this.filters));
    }

    getLoading() {
        return {
            isLoading: this.loading.isLoading,
            loadingLabel: this.loading.loadingLabel,
            message: this.loading.feedback
        };
    }

    private async runWithLoading<T>(
        action: Promise<T>,
        loadingLabel?: string,
        successMessage?: string,
        failureMessage?: string
    ) {
        return await this.loading.runCallbackWithLoading(
            action,
            loadingLabel,
            successMessage,
            failureMessage
        );
    }

    async listFilters() {
        const response = await this.runWithLoading<FilterDTO[]>(
            this.gateway.list(this.namespace),
            "Listing filters"
        );

        if (!response) {
            return;
        }

        runInAction(() => {
            this.filters.replace(
                this.sorter.sort(
                    response.map(filter => {
                        return FilterMapper.toDTO(filter);
                    })
                )
            );
        });
    }

    async getFilterById(id: string) {
        const filterInCache = this.filters.find(filter => {
            return filter.id === id;
        });

        if (filterInCache) {
            return structuredClone(toJS(filterInCache));
        }

        const response = await this.runWithLoading<FilterDTO>(this.gateway.get(id));

        if (!response) {
            return;
        }

        const filterDTO = FilterMapper.toDTO(response);
        runInAction(() => {
            this.filters.replace(this.sorter.sort([filterDTO, ...toJS(this.filters)]));
        });

        return structuredClone(toJS(filterDTO));
    }

    async createFilter(filter: FilterDTO) {
        const filterStorage = FilterMapper.toStorage(filter);
        const id = mdbid();

        const response = await this.runWithLoading<FilterDTO>(
            this.gateway.create({ ...filterStorage, id, namespace: this.namespace }),
            "Creating filter...",
            `Filter "${filterStorage.name}" was successfully created.`
        );

        if (!response) {
            return;
        }

        const filterDTO = FilterMapper.toDTO(response);
        runInAction(() => {
            this.filters.replace(this.sorter.sort([filterDTO, ...toJS(this.filters)]));
        });

        return structuredClone(toJS(filterDTO));
    }

    async updateFilter(filter: FilterDTO) {
        const filterStorage = FilterMapper.toStorage(filter);
        const response = await this.runWithLoading<FilterDTO>(
            this.gateway.update(filterStorage),
            "Updating filter...",
            `Filter "${filterStorage.name}" was successfully updated.`
        );

        if (!response) {
            return;
        }

        const filterIndex = this.filters.findIndex(f => f.id === filter.id);
        if (filterIndex > -1) {
            const filterDTO = FilterMapper.toDTO(response);

            runInAction(() => {
                const filters = toJS(this.filters);
                this.filters.replace(
                    this.sorter.sort([
                        ...filters.slice(0, filterIndex),
                        {
                            ...filters[filterIndex],
                            ...filterDTO
                        },
                        ...filters.slice(filterIndex + 1)
                    ])
                );
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
            "Deleting filter...",
            `Filter "${filter.name}" was successfully deleted.`
        );

        if (response) {
            runInAction(() => {
                this.filters.replace(
                    this.sorter.sort(toJS(this.filters.filter(filter => filter.id !== id)))
                );
            });
        }
    }
}
