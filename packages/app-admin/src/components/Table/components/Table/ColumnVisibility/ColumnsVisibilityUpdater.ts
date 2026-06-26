import { makeAutoObservable } from "mobx";
import type { OnDataTableColumnVisibilityChange } from "@webiny/admin-ui";
import type { IColumnsVisibilityRepository } from "./IColumnsVisibilityRepository.js";
import type { IColumnsVisibilityUpdater } from "./IColumnsVisibilityUpdater.js";

export class ColumnsVisibilityUpdater implements IColumnsVisibilityUpdater {
    private repository: IColumnsVisibilityRepository;

    constructor(repository: IColumnsVisibilityRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    public update: OnDataTableColumnVisibilityChange = async updaterOrValue => {
        const currentVisibility = this.repository.getVisibility();
        let newVisibility = currentVisibility;

        if (typeof updaterOrValue === "function") {
            newVisibility = updaterOrValue(currentVisibility || {});
        }

        this.repository.update(newVisibility || {});
    };
}
