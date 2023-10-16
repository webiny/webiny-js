import { makeAutoObservable, runInAction } from "mobx";
import {
    Feedback,
    FilterRepository,
    QueryObject,
    QueryObjectDTO,
    QueryObjectMapper
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
    applyFilter(filterId: string): Promise<void>;
    applyQueryObject(queryObject: QueryObjectDTO): void;
    unsetFilter(): void;
    editAppliedQueryObject(): void;
    createFilter(): void;
    editFilter(filterId: string): Promise<void>;
    deleteFilter(id: string): Promise<void>;
    saveQueryObject(queryObject: QueryObjectDTO): void;
    persistQueryObject(queryObject: QueryObjectDTO): Promise<void>;

    get vm(): {
        appliedQueryObject: QueryObjectDTO | null;
        currentQueryObject: QueryObjectDTO | null;
        feedbackVm: {
            isOpen: boolean;
            message: string;
        };
        managerVm: {
            isOpen: boolean;
            view: string;
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
    private currentQueryObject: QueryObjectDTO | null = null;
    private appliedQueryObject: QueryObjectDTO | null = null;

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
            loadingLabel: this.repository.loading.loadingLabel,
            filters: this.repository.filters.map(filter => ({
                id: filter.id,
                name: filter.name,
                description: filter.description || "",
                createdOn: filter.createdOn || ""
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
            loadingLabel: this.repository.loading.loadingLabel
        };
    }

    get vm() {
        return {
            appliedQueryObject: this.appliedQueryObject,
            currentQueryObject: this.currentQueryObject,
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
        this.currentQueryObject = null;
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
            this.appliedQueryObject = QueryObjectMapper.toDTO(filter);
            this.currentQueryObject = null;
            this.closeManager();
            this.closeBuilder();
            this.closeSaver();
        });
    }

    applyQueryObject(queryObject: QueryObjectDTO) {
        this.appliedQueryObject = queryObject;
        this.currentQueryObject = null;
        this.closeManager();
        this.closeBuilder();
        this.closeSaver();
    }

    unsetFilter() {
        this.appliedQueryObject = null;
        this.currentQueryObject = null;
    }

    editAppliedQueryObject() {
        this.currentQueryObject = this.appliedQueryObject;
        this.openBuilder();
    }

    createFilter() {
        this.currentQueryObject = QueryObjectMapper.toDTO(
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
            this.currentQueryObject = QueryObjectMapper.toDTO(filter);
            this.closeManager();
            this.openBuilder();
            this.closeSaver();
        });
    }

    async deleteFilter(id: string) {
        await this.repository.deleteFilter(id);

        runInAction(() => {
            this.currentQueryObject = null;
        });
    }

    saveQueryObject(queryObject: QueryObjectDTO) {
        this.currentQueryObject = queryObject;
        this.closeManager();
        this.openBuilder();
        this.openSaver();
    }

    async persistQueryObject(queryObject: QueryObjectDTO) {
        if (queryObject.id) {
            await this.updateFilterIntoRepository(queryObject);
        } else {
            await this.createFilterIntoRepository(queryObject);
        }

        runInAction(() => {
            this.closeManager();
            this.closeBuilder();
            this.closeSaver();
        });
    }

    private async createFilterIntoRepository(queryObject: QueryObjectDTO) {
        const filter = await this.repository.createFilter(queryObject);

        if (!filter) {
            return;
        }

        /**
         * repository.createFilter returns generates the filter id.
         * We need to set it back as appliedQueryObject, otherwise further actions on the filter would fail (update/delete).
         */
        runInAction(() => {
            this.appliedQueryObject = QueryObjectMapper.toDTO(filter);
            this.currentQueryObject = null;
        });
    }

    private async updateFilterIntoRepository(queryObject: QueryObjectDTO) {
        await this.repository.updateFilter(queryObject);

        runInAction(() => {
            this.appliedQueryObject = queryObject;
            this.currentQueryObject = null;
        });
    }
}
