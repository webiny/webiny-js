import { makeAutoObservable, runInAction } from "mobx";
import { QueryObjectDTO, QueryObjectRepository } from "~/components/AdvancedSearch/QueryObject";

export interface IAdvancedSearchPresenter {
    vm: AdvancedSearchViewModel;
    closeBuilder: () => void;
    closeManager: () => void;
    closeSaver: () => void;
    load: () => Promise<void>;
    onBuilderPersist: (filter: QueryObjectDTO) => void;
    onBuilderSubmit: (filter: QueryObjectDTO) => void;
    unsetFilter: () => void;
    editAppliedFilter: () => void;
    onManagerCreateFilter: () => void;
    editFilter: (filterId: string) => Promise<void>;
    applyFilter: (filterId: string) => Promise<void>;
    onSaverSubmit: (filter: QueryObjectDTO) => void;
    openBuilder: () => void;
    openManager: () => void;
    openSaver: () => void;
}

export interface AdvancedSearchViewModel {
    appliedFilter: QueryObjectDTO | null;
    queryObject: QueryObjectDTO | null;
    showBuilder: boolean;
    showSaver: boolean;
    showSelected: boolean;
    managerVm: {
        open: boolean;
        filters: Array<{
            id: string;
            name: string;
            description: string;
        }>;
    };
}

export class AdvancedSearchPresenter implements IAdvancedSearchPresenter {
    private showBuilder = false;
    private showManager = false;
    private showSaver = false;
    private repository: QueryObjectRepository;
    private showSelected = false;
    private currentFilter: QueryObjectDTO | null = null;
    private appliedFilter: QueryObjectDTO | null = null;

    constructor(repository: QueryObjectRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async load() {
        await this.repository.listFilters();
    }

    get vm() {
        return {
            appliedFilter: this.appliedFilter,
            queryObject: this.currentFilter,
            showBuilder: this.showBuilder,
            showSaver: this.showSaver,
            showSelected: this.showSelected,
            managerVm: {
                open: this.showManager,
                filters: this.repository.filters.map(filter => ({
                    id: filter.id,
                    name: filter.name,
                    description: filter.description || ""
                }))
            }
        };
    }

    openManager() {
        this.showManager = true;
    }

    closeManager() {
        this.showManager = false;
    }

    openBuilder() {
        this.showBuilder = true;
    }

    closeBuilder() {
        this.showBuilder = false;
    }

    openSaver() {
        this.showSaver = true;
    }

    closeSaver() {
        this.showSaver = false;
    }

    openSelected() {
        this.showSelected = true;
    }

    closeSelected() {
        this.showSelected = false;
    }

    async applyFilter(filterId: string) {
        const filter = await this.repository.getFilterById(filterId);
        // this.onSubmitCallback(filter);
        runInAction(() => {
            this.appliedFilter = filter;
            this.openSelected();
            this.closeManager();
        });
    }

    onManagerCreateFilter() {
        this.currentFilter = null;
        // this.repository.setMode(Mode.CREATE);
        this.closeManager();
        this.openBuilder();
    }

    async editFilter(filterId: string) {
        this.currentFilter = await this.repository.getFilterById(filterId);
        this.closeSelected();
        this.closeManager();
        this.openBuilder();
    }

    async deleteFilter(id: string) {
        await this.repository.deleteFilter(id);
    }

    onBuilderSubmit(filter: QueryObjectDTO) {
        this.currentFilter = filter;
        // this.onSubmitCallback(filter);
        this.closeBuilder();
        this.openSelected();
    }

    onBuilderPersist(filter: QueryObjectDTO) {
        this.currentFilter = filter;
        this.openSaver();
    }

    onSaverSubmit(filter: QueryObjectDTO) {
        // this.onSubmitCallback(filter);
        this.currentFilter = filter;
        this.closeBuilder();
        this.closeSaver();
        this.openSelected();
    }

    editAppliedFilter() {
        this.currentFilter = this.appliedFilter;
        this.openBuilder();
    }

    unsetFilter() {
        this.currentFilter = null;
        this.closeSelected();
        // this.onSubmitCallback(null);
    }
}
