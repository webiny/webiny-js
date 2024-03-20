import { makeAutoObservable } from "mobx";
import { ISortingRepository, SortingMapper } from "@webiny/app-utilities";
import { OnSortingChange } from "@webiny/ui/DataTable";
import { ISortController } from "../abstractions";

export class SortController implements ISortController {
    private repository: ISortingRepository;

    constructor(repository: ISortingRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    public execute: OnSortingChange = updaterOrValue => {
        let newSorts = this.repository.get().map(sort => SortingMapper.fromDTOtoColumn(sort));

        if (typeof updaterOrValue === "function") {
            newSorts = updaterOrValue(newSorts || []);
        }

        this.repository.set(newSorts.map(sort => SortingMapper.fromColumnToDTO(sort)));
    };
}
