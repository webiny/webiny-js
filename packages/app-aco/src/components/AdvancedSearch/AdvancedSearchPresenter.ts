import { makeAutoObservable, runInAction } from "mobx";
import {
    Feedback,
    Loading,
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
    private listLoading: Loading;
    private createLoading: Loading;
    private updateLoading: Loading;
    private deleteLoading: Loading;

    private showBuilder = false;
    private showManager = false;
    private showSaver = false;

    currentFilter: QueryObjectDTO | null = null;
    appliedFilter: QueryObjectDTO | null = null;

    constructor(repository: QueryObjectRepository) {
        this.repository = repository;
        this.feedback = new Feedback();
        this.listLoading = new Loading(this.feedback);
        this.createLoading = new Loading(this.feedback);
        this.updateLoading = new Loading(this.feedback);
        this.deleteLoading = new Loading(this.feedback);
        makeAutoObservable(this);
    }

    async load() {
        await this.listLoading.runCallbackWithLoading(
            this.repository.listFilters(),
            "Listing filters"
        );
    }

    private get managerVm() {
        const vm = {
            isOpen: this.showManager,
            view: "EMPTY",
            loadingLabel: this.listLoading.loadingLabel || this.deleteLoading.loadingLabel,
            filters: this.repository.filters.map(filter => ({
                id: filter.id,
                name: filter.name,
                description: filter.description || ""
            }))
        };

        if (this.repository.filters.length !== 0) {
            vm.view = "LIST";
        }

        if (this.listLoading.isLoading || this.deleteLoading.isLoading) {
            vm.view = "LOADING";
        }

        return vm;
    }

    private get feedbackVm() {
        return {
            isOpen: Boolean(this.feedback.message),
            message: this.feedback.message
        };
    }

    private get builderVm() {
        return {
            open: this.showBuilder
        };
    }

    private get saverVm() {
        return {
            open: this.showSaver,
            isLoading: this.createLoading.isLoading || this.updateLoading.isLoading,
            loadingLabel: this.createLoading.loadingLabel || this.updateLoading.loadingLabel,
            filter: this.currentFilter
        };
    }

    get vm() {
        return {
            appliedFilter: this.appliedFilter,
            currentFilter: this.currentFilter,
            showBuilder: this.showBuilder,
            showSaver: this.showSaver,
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

        runInAction(() => {
            this.currentFilter = filter;
            this.closeManager();
            this.openBuilder();
            this.closeSaver();
        });
    }

    async deleteFilter(id: string) {
        const filter = await this.repository.getFilterById(id);

        await this.deleteLoading.runCallbackWithLoading(
            this.repository.deleteFilter(id),
            "Deleting filters",
            `Filter "${filter.name}" was successfully deleted.`
        );

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
        const createFilter = async () => {
            const newFilter = await this.repository.createFilter(filter);

            /**
             * repository.createFilter returns the storage generated filter id.
             * We need to set it back as appliedFilter, otherwise further actions on the filter would fail (update/delete).
             */
            runInAction(() => {
                this.appliedFilter = newFilter;
                this.currentFilter = null;
            });
        };

        await this.createLoading.runCallbackWithLoading(
            createFilter(),
            "Creating filter",
            `Filter "${filter.name}" was successfully created.`
        );
    }

    private async updateFilterIntoRepository(filter: QueryObjectDTO) {
        await this.updateLoading.runCallbackWithLoading(
            this.repository.updateFilter(filter),
            "Updating filter",
            `Filter "${filter.name}" was successfully updated.`
        );

        runInAction(() => {
            this.appliedFilter = filter;
            this.currentFilter = null;
        });
    }
}
