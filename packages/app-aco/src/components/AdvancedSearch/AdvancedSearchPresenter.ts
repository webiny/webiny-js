import { makeAutoObservable } from "mobx";
import { Mode, QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";
import { AdvancedSearchRepository } from "~/components/AdvancedSearch/AdvancedSearchRepository";

export class AdvancedSearchPresenter {
    private repository: AdvancedSearchRepository;
    private readonly onSubmitCallback: (data: QueryObjectDTO) => void;
    showBuilder = false;
    showManager = false;
    showSaver = false;

    constructor(
        repository: AdvancedSearchRepository,
        onSubmitCallback: (data: QueryObjectDTO) => void
    ) {
        this.repository = repository;
        this.onSubmitCallback = onSubmitCallback;
        makeAutoObservable(this);
    }

    openManager = () => {
        this.showManager = true;
    };

    closeManager = () => {
        this.showManager = false;
    };

    openBuilder = () => {
        this.showBuilder = true;
    };

    closeBuilder = () => {
        this.showBuilder = false;
    };

    openSaver = () => {
        this.showSaver = true;
    };

    closeSaver = () => {
        this.showSaver = false;
    };

    onManagerSelectFilter = (filter: QueryObjectDTO) => {
        this.repository.setFilter(filter);
        this.onSubmitCallback(filter);
        this.closeManager();
    };

    onManagerCreateFilter = () => {
        this.repository.setFilter(null);
        this.repository.setMode(Mode.CREATE);
        this.closeManager();
        this.openBuilder();
    };

    onManagerEditFilter = (filter: QueryObjectDTO) => {
        this.repository.setFilter(filter);
        this.repository.setMode(Mode.UPDATE);
        this.closeManager();
        this.openBuilder();
    };

    onBuilderSubmit = (filter: QueryObjectDTO) => {
        this.repository.setFilter(filter);
        this.onSubmitCallback(filter);
        this.closeBuilder();
    };

    onBuilderPersist = (filter: QueryObjectDTO) => {
        this.repository.setFilter(filter);
        this.openSaver();
    };

    onSaverSubmit = (filter: QueryObjectDTO) => {
        this.onSubmitCallback(filter);
        this.closeBuilder();
        this.closeSaver();
    };

    getViewModel = () => {
        return {
            queryObject: this.repository.getFilter(),
            mode: this.repository.getMode(),
            showBuilder: this.showBuilder,
            showManager: this.showManager,
            showSaver: this.showSaver
        };
    };
}
