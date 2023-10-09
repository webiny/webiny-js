import { makeAutoObservable } from "mobx";
import {
    Mode,
    QueryObjectDTO,
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
    showSelected: boolean;
}

export class AdvancedSearchPresenter {
    private repository: QueryObjectRepository;
    private readonly onSubmitCallback: (data: QueryObjectDTO | null) => void;
    private showBuilder = false;
    private showManager = false;
    private showSaver = false;
    private showSelected = false;
    private callback: ((viewModel: AdvancedSearchViewModel) => void) | undefined = undefined;
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

    load(callback: (viewModel: AdvancedSearchViewModel) => void) {
        this.callback = callback;
        this.callback && this.callback(this.viewModel);
    }

    updateViewModel() {
        this.viewModel = {
            queryObject: this.queryObject,
            mode: this.mode,
            showBuilder: this.showBuilder,
            showManager: this.showManager,
            showSaver: this.showSaver,
            showSelected: this.showSelected
        };
        this.callback && this.callback(this.viewModel);
    }

    openManager() {
        this.showManager = true;
        this.updateViewModel();
    }

    closeManager() {
        this.showManager = false;
        this.updateViewModel();
    }

    openBuilder() {
        this.showBuilder = true;
    }

    closeBuilder() {
        this.showBuilder = false;
        this.updateViewModel();
    }

    openSaver() {
        this.showSaver = true;
    }

    closeSaver() {
        this.showSaver = false;
        this.updateViewModel();
    }

    openSelected() {
        this.showSelected = true;
    }

    closeSelected() {
        this.showSelected = false;
        this.updateViewModel();
    }

    createFilter() {
        this.queryObject = null;
        this.mode = Mode.CREATE;
        this.closeSelected();
        this.closeManager();
        this.openBuilder();
        this.closeSaver();
        this.updateViewModel();
    }

    editFilter(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
        this.mode = Mode.UPDATE;
        this.closeManager();
        this.openBuilder();
        this.closeSaver();
        this.updateViewModel();
    }

    removeFilter() {
        this.queryObject = null;
        this.onSubmitCallback(null);
        this.closeSelected();
        this.closeManager();
        this.closeBuilder();
        this.closeSaver();
        this.updateViewModel();
    }

    applyFilter(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
        this.onSubmitCallback(queryObject);
        this.openSelected();
        this.closeManager();
        this.closeBuilder();
        this.closeSaver();
        this.updateViewModel();
    }

    persistFilter(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
        this.closeManager();
        this.openBuilder();
        this.openSaver();
        this.updateViewModel();
    }

    saveFilter(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
        this.onSubmitCallback(queryObject);
        this.openSelected();
        this.closeManager();
        this.closeBuilder();
        this.closeSaver();
        this.updateViewModel();
    }
}
