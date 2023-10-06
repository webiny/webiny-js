import { makeAutoObservable } from "mobx";
import { Mode, QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";
import { AdvancedSearchRepository } from "~/components/AdvancedSearch/AdvancedSearchRepository";

export interface IAdvancedSearchPresenter {
    closeBuilder: () => void;
    closeManager: () => void;
    closeSaver: () => void;
    load: (callback: (viewModel: AdvancedSearchViewModel) => void) => void;
    onBuilderPersist: (filter: QueryObjectDTO) => void;
    onBuilderSubmit: (filter: QueryObjectDTO) => void;
    onChipDelete: () => void;
    onChipEdit: () => void;
    onManagerCreateFilter: () => void;
    onManagerEditFilter: (filter: QueryObjectDTO) => void;
    onManagerSelectFilter: (filter: QueryObjectDTO) => void;
    onSaverSubmit: (filter: QueryObjectDTO) => void;
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
    showChip: boolean;
}

export class AdvancedSearchPresenter implements IAdvancedSearchPresenter {
    private repository: AdvancedSearchRepository;
    private readonly onSubmitCallback: (data: QueryObjectDTO | null) => void;
    private showBuilder = false;
    private showManager = false;
    private showSaver = false;
    private showChip = false;
    private callback: ((viewModel: AdvancedSearchViewModel) => void) | undefined = undefined;

    viewModel: AdvancedSearchViewModel;

    constructor(
        repository: AdvancedSearchRepository,
        onSubmitCallback: (data: QueryObjectDTO | null) => void
    ) {
        this.repository = repository;
        this.onSubmitCallback = onSubmitCallback;
        this.viewModel = {
            queryObject: this.repository.getFilter(),
            mode: this.repository.getMode(),
            showBuilder: this.showBuilder,
            showManager: this.showManager,
            showSaver: this.showSaver,
            showChip: this.showChip
        };
        makeAutoObservable(this);
    }

    load(callback: (viewModel: AdvancedSearchViewModel) => void) {
        this.callback = callback;
        this.updateViewModel();
    }

    updateViewModel() {
        this.viewModel = {
            queryObject: this.repository.getFilter(),
            mode: this.repository.getMode(),
            showBuilder: this.showBuilder,
            showManager: this.showManager,
            showSaver: this.showSaver,
            showChip: this.showChip
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
        this.updateViewModel();
    }

    closeBuilder() {
        this.showBuilder = false;
        this.updateViewModel();
    }

    openSaver() {
        this.showSaver = true;
        this.updateViewModel();
    }

    closeSaver() {
        this.showSaver = false;
        this.updateViewModel();
    }

    openChip() {
        this.showChip = true;
        this.updateViewModel();
    }

    closeChip() {
        this.showChip = false;
        this.updateViewModel();
    }

    onManagerSelectFilter(filter: QueryObjectDTO) {
        this.repository.setFilter(filter);
        this.onSubmitCallback(filter);
        this.openChip();
        this.closeManager();
        this.updateViewModel();
    }

    onManagerCreateFilter() {
        this.repository.setFilter(null);
        this.repository.setMode(Mode.CREATE);
        this.closeManager();
        this.openBuilder();
        this.updateViewModel();
    }

    onManagerEditFilter(filter: QueryObjectDTO) {
        this.repository.setFilter(filter);
        this.repository.setMode(Mode.UPDATE);
        this.closeManager();
        this.openBuilder();
        this.updateViewModel();
    }

    onBuilderSubmit(filter: QueryObjectDTO) {
        this.repository.setFilter(filter);
        this.onSubmitCallback(filter);
        this.closeBuilder();
        this.openChip();
        this.updateViewModel();
    }

    onBuilderPersist(filter: QueryObjectDTO) {
        this.repository.setFilter(filter);
        this.openSaver();
        this.updateViewModel();
    }

    onSaverSubmit(filter: QueryObjectDTO) {
        this.onSubmitCallback(filter);
        this.repository.setFilter(filter);
        this.closeBuilder();
        this.closeSaver();
        this.openChip();
        this.updateViewModel();
    }

    onChipEdit() {
        this.openBuilder();
        this.updateViewModel();
    }

    onChipDelete() {
        this.repository.setFilter(null);
        this.closeChip();
        this.onSubmitCallback(null);
        this.updateViewModel();
    }
}
