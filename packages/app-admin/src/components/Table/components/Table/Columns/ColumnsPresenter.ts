import { makeAutoObservable } from "mobx";
import type { IColumnsRepository } from "./IColumnsRepository.js";

export class ColumnsPresenter {
    private repository: IColumnsRepository;

    constructor(repository: IColumnsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async init() {
        await this.repository.init();
    }

    get vm() {
        return {
            columns: this.repository.getColumns()
        };
    }
}
