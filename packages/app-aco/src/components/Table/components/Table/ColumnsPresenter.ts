import { makeAutoObservable } from "mobx";
import { ColumnVisibility, OnColumnVisibilityChange } from "@webiny/ui/DataTable";
import { ColumnsVisibilityUpdater } from "./ColumnsVisibilityUpdater";
import { IColumnsRepository } from "./domain/IColumnsRepository";

export class ColumnsPresenter {
    private updater: ColumnsVisibilityUpdater;
    private repository: IColumnsRepository;

    constructor(updater: ColumnsVisibilityUpdater, repository: IColumnsRepository) {
        this.updater = updater;
        this.repository = repository;
        makeAutoObservable(this);
    }

    get vm() {
        return {
            columns: this.repository.get(),
            columnsVisibility: this.getColumnsVisibility()
        };
    }

    private getColumnsVisibility() {
        return this.repository.get().reduce((visibility, column) => {
            const { name, visible } = column;

            visibility[name] = visible;

            return visibility;
        }, {} as ColumnVisibility);
    }

    public updateColumnVisibility: OnColumnVisibilityChange = async updaterOrValue => {
        const currentVisibility = this.getColumnsVisibility();
        let newVisibility = currentVisibility;

        if (typeof updaterOrValue === "function") {
            newVisibility = updaterOrValue(currentVisibility);
        }

        this.updater.update(newVisibility);
    };
}
