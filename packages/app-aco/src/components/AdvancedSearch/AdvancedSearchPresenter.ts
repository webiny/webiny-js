import { makeAutoObservable, runInAction } from "mobx";
import {
    Feedback,
    QueryObject,
    QueryObjectDTO,
    QueryObjectMapper,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";

export interface IAdvancedSearchPresenter {
    closeBuilder: () => void;
    closeManager: () => void;
    closeSaver: () => void;
    load: () => Promise<void>;
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

export class AdvancedSearchPresenter {
    private repository: QueryObjectRepository;

    private readonly feedback: Feedback;
    private showBuilder = false;
    private showManager = false;
    private showSaver = false;
    private currentFilter: QueryObjectDTO | null = null;
    private appliedFilter: QueryObjectDTO | null = null;

    constructor(repository: QueryObjectRepository) {
        this.repository = repository;
        this.feedback = new Feedback();
        makeAutoObservable(this);
    }

    async load() {
        await this.repository.listFilters();
    }

    private get managerVm() {
        const vm = {
            isOpen: this.showManager,
            view: "EMPTY",
            loadingLabel: this.repository.loading.loadingLabel,
            filters: this.repository.filters.map(filter => ({
                id: filter.id,
                name: filter.name,
                description: filter.description || ""
            }))
        };

        if (this.repository.filters.length !== 0) {
            vm.view = "LIST";
        }

        if (this.repository.loading.isLoading) {
            vm.view = "LOADING";
        }

        return vm;
    }

    private get feedbackVm() {
        return {
            isOpen: Boolean(this.feedback.message || this.repository.loading.message),
            message: this.feedback.message || this.repository.loading.message
        };
    }

    private get builderVm() {
        return {
            isOpen: this.showBuilder
        };
    }

    private get saverVm() {
        return {
            isOpen: this.showSaver,
            isLoading: this.repository.loading.isLoading,
            loadingLabel: this.repository.loading.loadingLabel,
            filter: this.currentFilter
        };
    }

    get vm() {
        return {
            appliedFilter: this.appliedFilter,
            currentFilter: this.currentFilter,
            feedbackVm: this.feedbackVm,
            managerVm: this.managerVm,
            builderVm: this.builderVm,
            saverVm: this.saverVm
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

    showFeedback(message: string) {
        this.feedback.message = message;
    }

    async applyFilter(filterId: string) {
        const filter = await this.repository.getFilterById(filterId);

        if (!filter) {
            return;
        }

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
        this.openBuilder();
    }

    createFilter() {
        this.currentFilter = QueryObjectMapper.toDTO(
            QueryObject.createEmpty(this.repository.modelId)
        );
        this.closeManager();
        this.openBuilder();
        this.closeSaver();
    }

    async editFilter(filterId: string) {
        const filter = await this.repository.getFilterById(filterId);

        if (!filter) {
            return;
        }

        runInAction(() => {
            this.currentFilter = filter;
            this.closeManager();
            this.openBuilder();
            this.closeSaver();
        });
    }

    async deleteFilter(id: string) {
        await this.repository.deleteFilter(id);

        runInAction(() => {
            this.currentFilter = null;
        });
    }

    persistFilter(queryObject: QueryObjectDTO) {
        this.currentFilter = queryObject;
        this.closeManager();
        this.openBuilder();
        this.openSaver();
    }

    async saveFilter(filter: QueryObjectDTO) {
        if (filter.id) {
            await this.updateFilterIntoRepository(filter);
        } else {
            await this.createFilterIntoRepository(filter);
        }

        runInAction(() => {
            this.closeManager();
            this.closeBuilder();
            this.closeSaver();
        });
    }

    private async createFilterIntoRepository(filter: QueryObjectDTO) {
        const newFilter = await this.repository.createFilter(filter);

        if (!newFilter) {
            return;
        }

        /**
         * repository.createFilter returns the storage generated filter id.
         * We need to set it back as appliedFilter, otherwise further actions on the filter would fail (update/delete).
         */
        runInAction(() => {
            this.appliedFilter = newFilter;
            this.currentFilter = null;
        });
    }

    private async updateFilterIntoRepository(filter: QueryObjectDTO) {
        await this.repository.updateFilter(filter);

        runInAction(() => {
            this.appliedFilter = filter;
            this.currentFilter = null;
        });
    }
}
