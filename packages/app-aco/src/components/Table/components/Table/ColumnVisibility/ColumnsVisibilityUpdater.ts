import { makeAutoObservable } from "mobx";
import { IColumnsVisibilityRepository } from "./IColumnsVisibilityRepository";
import { IColumnsVisibilityUpdater } from "./IColumnsVisibilityUpdater";
import { OnColumnVisibilityChange } from "@webiny/ui/DataTable";

export class ColumnsVisibilityUpdater implements IColumnsVisibilityUpdater {
    private repository: IColumnsVisibilityRepository;

    constructor(repository: IColumnsVisibilityRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    public update: OnColumnVisibilityChange = async updaterOrValue => {
        const currentVisibility = this.repository.getVisibility();
        let newVisibility = currentVisibility;

        if (typeof updaterOrValue === "function") {
            newVisibility = updaterOrValue(currentVisibility || {});
        }

        this.repository.update(newVisibility || {});
    };
}
