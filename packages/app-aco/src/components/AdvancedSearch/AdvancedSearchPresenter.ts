import { makeAutoObservable } from "mobx";
import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";
import { AdvancedSearchRepository } from "~/components/AdvancedSearch/AdvancedSearchRepository";

export class AdvancedSearchPresenter {
    private repository: AdvancedSearchRepository;
    private readonly onSubmitCallback: (data: QueryObjectDTO) => void;
    showBuilder = false;
    showManager = false;

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

    onBuilderSubmit = (filter: QueryObjectDTO) => {
        this.repository.setFilter(filter);
        this.onSubmitCallback(filter);
        this.closeBuilder();
    };

    onManagerSelectFilter = (filter: QueryObjectDTO) => {
        this.repository.setFilter(filter);
        this.onSubmitCallback(filter);
        this.closeManager();
    };

    onManagerCreateFilter = () => {
        this.repository.setFilter(undefined);
        this.closeManager();
        this.openBuilder();
    };

    onManagerEditFilter = (filter: QueryObjectDTO) => {
        this.repository.setFilter(filter);
        this.closeManager();
        this.openBuilder();
    };

    getViewModel = () => {
        return {
            queryObject: this.repository.getFilter(),
            showBuilder: this.showBuilder,
            showManager: this.showManager
        };
    };
}
