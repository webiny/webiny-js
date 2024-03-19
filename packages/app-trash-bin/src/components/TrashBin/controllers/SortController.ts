import { makeAutoObservable } from "mobx";
import { ISortRepository, SortMapper } from "@webiny/app-trash-bin-common";
import { OnSortingChange } from "@webiny/ui/DataTable";
import { ISortController } from "../abstractions";

export class SortController implements ISortController {
    private repository: ISortRepository;

    constructor(repository: ISortRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    public execute: OnSortingChange = updaterOrValue => {
        const currentSorts = this.repository.get().map(sort => SortMapper.fromDTOtoColumn(sort));
        let newSorts = currentSorts;

        if (typeof updaterOrValue === "function") {
            newSorts = updaterOrValue(currentSorts || {});
        }

        this.repository.set(newSorts.map(sort => SortMapper.fromColumnToDTO(sort)));
    };
}
