import { makeAutoObservable, runInAction } from "mobx";
import {
    Feedback,
    Filter,
    FilterDTO,
    FilterMapper,
    FilterRepository
} from "~/components/AdvancedSearch/domain";

export interface AdvancedSearchPresenterInterface {
    load(): Promise<void>;
    openManager(): void;
    closeManager(): void;
    openBuilder(): void;
    closeBuilder(): void;
    openSaver(): void;
    closeSaver(): void;
    showFeedback(message: string): void;
    applyFilter(filter: string | FilterDTO): Promise<void>;
    unsetFilter(): void;
    editAppliedFilter(): void;
    createFilter(): void;
    editFilter(filterId: string): Promise<void>;
    deleteFilter(id: string): Promise<void>;
    saveFilter(filter: FilterDTO): void;
    renameFilter(filterId: string): Promise<void>;
    cloneFilter(filterId: string): Promise<void>;
    persistFilter(filter: FilterDTO): Promise<void>;
    get vm(): {
        currentFilter: FilterDTO | null;
        appliedFilter: FilterDTO | null;
        feedbackVm: {
            isOpen: boolean;
            message: string;
        };
        managerVm: {
            isOpen: boolean;
            view: string;
            isLoading: boolean;
            loadingLabel: string;
            filters: Array<{
                id: string;
                name: string;
                description: string;
                createdOn: string;
            }>;
        };
        builderVm: {
            isOpen: boolean;
        };
        saverVm: {
            isOpen: boolean;
            isLoading: boolean;
            loadingLabel: string;
        };
    };
}

export class AdvancedSearchPresenter implements AdvancedSearchPresenterInterface {
    private repository: FilterRepository;
    private readonly feedback: Feedback;
    private showBuilder = false;
    private showManager = false;
    private showSaver = false;
    private currentFilter: FilterDTO | null = null;
    private appliedFilter: FilterDTO | null = null;

    constructor(repository: FilterRepository) {
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
            isLoading: this.repository.getLoading().isLoading,
            loadingLabel: this.repository.getLoading().loadingLabel,
            filters: this.repository.getFilters().map(filter => ({
                id: filter.id,
                name: filter.name,
                description: filter.description || "",
                createdOn: filter.createdOn || ""
            }))
        };

        if (this.repository.getFilters().length !== 0) {
            vm.view = "LIST";
        }

        return vm;
    }

    private get feedbackVm() {
        return {
            isOpen: Boolean(this.feedback.message || this.repository.getLoading().message),
            message: this.feedback.message || this.repository.getLoading().message
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
            isLoading: this.repository.getLoading().isLoading,
            loadingLabel: this.repository.getLoading().loadingLabel
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

    async applyFilter(filter: string | FilterDTO): Promise<void> {
        let filterDto: FilterDTO;

        if (typeof filter === "string") {
            const result = await this.repository.getFilterById(filter);

            if (!result) {
                return;
            }

            filterDto = result;
        } else {
            filterDto = filter;
        }

        runInAction(() => {
            this.appliedFilter = filterDto;
            this.currentFilter = null;
            this.closeManager();
            this.closeBuilder();
            this.closeSaver();
        });
    }

    unsetFilter() {
        this.appliedFilter = null;
        this.currentFilter = null;
    }

    editAppliedFilter() {
        this.currentFilter = this.appliedFilter;
        this.openBuilder();
    }

    async renameFilter(filterId: string) {
        const filter = await this.repository.getFilterById(filterId);

        if (!filter) {
            return;
        }

        runInAction(() => {
            this.currentFilter = filter;
            this.closeManager();
            this.closeBuilder();
            this.openSaver();
        });
    }

    createFilter() {
        this.currentFilter = FilterMapper.toDTO(Filter.createEmpty());
        this.closeManager();
        this.openBuilder();
        this.closeSaver();
    }

    async cloneFilter(filterId: string) {
        const filter = await this.repository.getFilterById(filterId);

        if (!filter) {
            return;
        }

        runInAction(() => {
            this.currentFilter = FilterMapper.toDTO(
                Filter.create({ ...filter, id: "", name: `Clone of ${filter.name}` })
            );
            this.closeManager();
            this.openBuilder();
            this.closeSaver();
        });
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

    async deleteFilter(filterId: string) {
        await this.repository.deleteFilter(filterId);

        runInAction(() => {
            this.currentFilter = null;
        });
    }

    saveFilter(filter: FilterDTO) {
        this.currentFilter = filter;
        this.closeManager();
        this.openBuilder();
        this.openSaver();
    }

    async persistFilter(filter: FilterDTO) {
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

    private async createFilterIntoRepository(filterDto: FilterDTO) {
        const newFilter = await this.repository.createFilter(filterDto);

        if (!newFilter) {
            return;
        }

        /**
         * repository.createFilter returns generates the filter id.
         * We need to set it back as appliedFilter, otherwise further actions on the filter would fail (update/delete).
         */
        runInAction(() => {
            this.appliedFilter = newFilter;
            this.currentFilter = null;
        });
    }

    private async updateFilterIntoRepository(filter: FilterDTO) {
        await this.repository.updateFilter(filter);

        runInAction(() => {
            this.appliedFilter = filter;
            this.currentFilter = null;
        });
    }
}
