import { makeAutoObservable } from "mobx";
import { IColumnsRepository } from "./IColumnsRepository";

export class ColumnsPresenter {
    private repository: IColumnsRepository;

    constructor(repository: IColumnsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    init() {
        this.repository.init();
    }

    get vm() {
        return {
            columns: this.repository.getColumns()
        };
    }
}
