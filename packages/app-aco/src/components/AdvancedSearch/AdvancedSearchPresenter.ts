import { makeAutoObservable, runInAction } from "mobx";
import {
    Mode,
    QueryObject,
    QueryObjectDTO,
    QueryObjectMapper,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";

export interface IAdvancedSearchPresenter {
    closeBuilder: () => void;
    closeManager: () => void;
    closeSaver: () => void;
    load: (callback: (viewModel: AdvancedSearchViewModel) => void) => void;
    onBuilderPersist: (filterId: string) => Promise<void>;
    onBuilderSubmit: (filterId: string) => Promise<void>;
    onChipDelete: () => void;
    onChipEdit: () => void;
    onManagerCreateFilter: () => void;
    onManagerEditFilter: (filterId: string) => Promise<void>;
    onManagerSelectFilter: (filterId: string) => Promise<void>;
    onSaverSubmit: (filterId: string) => Promise<void>;
    openBuilder: () => void;
    openManager: () => void;
    openSaver: () => void;
    updateViewModel: () => void;
}

export interface AdvancedSearchViewModel {
    queryObject: QueryObjectDTO | null;
    mode: Mode;
    showBuilder: boolean;
    showManager: boolean;
    showSaver: boolean;
}

export class AdvancedSearchPresenter {
    private repository: QueryObjectRepository;
    private showBuilder = false;
    private showManager = false;
    private showSaver = false;
    private mode: Mode = Mode.CREATE;
    currentFilter: QueryObjectDTO | null = null;
    appliedFilter: QueryObjectDTO | null = null;

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
            currentFilter: this.currentFilter,
            showBuilder: this.showBuilder,
            showSaver: this.showSaver,
            managerVm: {
                open: this.showManager,
                filters: this.repository.filters.map(filter => ({
                    id: filter.id,
                    name: filter.name,
                    description: filter.description || ""
                }))
            },
            builderVm: {
                open: this.showBuilder
            },
            saverVm: {
                open: this.showSaver,
                filter: this.currentFilter
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
        this.currentFilter = null;
    }

    openSaver() {
        this.showSaver = true;
    }

    closeSaver() {
        this.showSaver = false;
    }

    async applyFilter(filterId: string) {
        const filter = await this.repository.getFilterById(filterId);

        runInAction(() => {
            this.appliedFilter = filter;
            this.currentFilter = null;
            this.closeManager();
            this.closeBuilder();
            this.closeSaver();
        });
    }

    applyQueryObject(queryObject: QueryObjectDTO) {
        this.appliedFilter = queryObject;
        this.currentFilter = queryObject;
        this.closeManager();
        this.closeBuilder();
        this.closeSaver();
    }

    unsetFilter() {
        this.appliedFilter = null;
        this.currentFilter = null;
    }

    editAppliedFilter() {
        this.currentFilter = this.appliedFilter;
        this.mode = Mode.UPDATE;
        this.openBuilder();
    }

    createFilter() {
        this.currentFilter = QueryObjectMapper.toDTO(
            QueryObject.createEmpty(this.repository.modelId)
        );
        this.mode = Mode.CREATE;
        this.closeManager();
        this.openBuilder();
        this.closeSaver();
    }

    async editFilter(filterId: string) {
        const filter = await this.repository.getFilterById(filterId);

        runInAction(() => {
            this.currentFilter = filter;
            this.mode = Mode.UPDATE;
            this.closeManager();
            this.openBuilder();
            this.closeSaver();
        });
    }

    async deleteFilter(id: string) {
        await this.repository.deleteFilter(id);
        runInAction(() => {
            this.currentFilter = null;
            this.appliedFilter = null;
        });
    }

    persistFilter(queryObject: QueryObjectDTO) {
        this.currentFilter = queryObject;
        this.closeManager();
        this.openBuilder();
        this.openSaver();
    }

    async saveFilter(filter: QueryObjectDTO) {
        if (this.mode === Mode.CREATE) {
            await this.repository.createFilter(filter);
        } else {
            await this.repository.updateFilter(filter);
        }

        runInAction(() => {
            this.appliedFilter = filter;
            this.currentFilter = null;
            this.closeManager();
            this.closeBuilder();
            this.closeSaver();
        });
    }
}
