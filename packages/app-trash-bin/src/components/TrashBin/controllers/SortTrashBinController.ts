import { makeAutoObservable } from "mobx";
import { OnSortingChange } from "@webiny/ui/DataTable";
import { ISortController, ISortEntriesController } from "../abstractions";

export class SortTrashBinController implements ISortController {
    private sortController: ISortController;
    private sortEntriesController: ISortEntriesController;

    constructor(sortController: ISortController, sortEntriesController: ISortEntriesController) {
        this.sortController = sortController;
        this.sortEntriesController = sortEntriesController;
        makeAutoObservable(this);
    }

    public execute: OnSortingChange = async updaterOrValue => {
        this.sortController.execute(updaterOrValue);
        await this.sortEntriesController.execute();
    };
}
