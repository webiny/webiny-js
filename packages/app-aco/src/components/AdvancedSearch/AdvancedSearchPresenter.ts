import { makeAutoObservable, runInAction } from "mobx";
import {
    Feedback,
    Loading,
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

    private feedback: Feedback;
    private listLoading: Loading;
    private createLoading: Loading;
    private updateLoading: Loading;
    private deleteLoading: Loading;

    private showBuilder = false;
    private showManager = false;
    private showSaver = false;
    private mode: Mode = Mode.CREATE;

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

    get vm() {
        return {
            appliedFilter: this.appliedFilter,
            currentFilter: this.currentFilter,
            showBuilder: this.showBuilder,
            showSaver: this.showSaver,
            feedbackVm: {
                isOpen: !!this.feedback.message,
                message: this.feedback.message
            },
            managerVm: {
                isOpen: this.showManager,
                isLoading: this.listLoading.isLoading || this.deleteLoading.isLoading,
                loadingLabel: this.listLoading.loadingLabel || this.deleteLoading.loadingLabel,
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
                isLoading: this.createLoading.isLoading || this.updateLoading.isLoading,
                loadingLabel: this.createLoading.loadingLabel || this.updateLoading.loadingLabel,
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
        if (this.mode === Mode.CREATE) {
            await this.createFilterIntoRepository(filter);
        } else {
            await this.updateFilterIntoRepository(filter);
        }

        runInAction(() => {
            this.appliedFilter = filter;
            this.currentFilter = null;
            this.closeManager();
            this.closeBuilder();
            this.closeSaver();
        });
    }

    private async createFilterIntoRepository(filter: QueryObjectDTO) {
        await this.createLoading.runCallbackWithLoading(
            this.repository.createFilter(filter),
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
    }
}
