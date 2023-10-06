import { makeAutoObservable } from "mobx";
import {
    Mode,
    QueryObjectDTO,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";
import { QuerySaverViewModel } from "~/components/AdvancedSearch/QuerySaverDialog/adapters";

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
    showSelected: boolean;
}

export class AdvancedSearchPresenter {
    private repository: QueryObjectRepository;
    private readonly onSubmitCallback: (data: QueryObjectDTO | null) => void;
    private showBuilder = false;
    private showManager = false;
    private showSaver = false;
    private showSelected = false;
    private mode: Mode = Mode.CREATE;
    private queryObject: QueryObjectDTO | null = null;
    viewModel: AdvancedSearchViewModel;

    constructor(
        repository: QueryObjectRepository,
        onSubmitCallback: (data: QueryObjectDTO | null) => void
    ) {
        this.repository = repository;
        this.onSubmitCallback = onSubmitCallback;
        this.viewModel = {
            queryObject: null,
            mode: this.mode,
            showBuilder: this.showBuilder,
            showManager: this.showManager,
            showSaver: this.showSaver,
            showSelected: this.showSelected
        };
        makeAutoObservable(this);
    }

    get vm() {
        return this.viewModel;
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

    createFilter() {
        this.queryObject = null;
        this.mode = Mode.CREATE;
        this.closeSelected();
        this.closeManager();
        this.openBuilder();
        this.closeSaver();
    }

    async editFilter(filterId: string) {
        this.queryObject = await this.repository.getFilterById(filterId);
        this.mode = Mode.UPDATE;
        this.closeManager();
        this.openBuilder();
        this.closeSaver();
    }

    removeFilter() {
        this.queryObject = null;
        this.onSubmitCallback(null);
        this.closeSelected();
        this.closeManager();
        this.closeBuilder();
        this.closeSaver();
    }

    async applyFilter(filterId: string) {
        const filter = await this.repository.getFilterById(filterId);
        this.queryObject = filter;
        this.onSubmitCallback(filter);
        this.openSelected();
        this.closeManager();
        this.closeBuilder();
        this.closeSaver();
    }

    async persistFilter(filterId: string) {
        this.queryObject = await this.repository.getFilterById(filterId);
        this.closeManager();
        this.openBuilder();
        this.openSaver();
    }

    async saveFilter(filterId: string) {
        this.queryObject = await this.repository.getFilterById(filterId);
        this.onSubmitCallback(this.queryObject);
        this.openSelected();
        this.closeManager();
        this.closeBuilder();
        this.closeSaver();
    }
}
