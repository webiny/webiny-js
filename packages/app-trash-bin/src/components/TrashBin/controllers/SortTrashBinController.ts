import { makeAutoObservable } from "mobx";
import { OnSortingChange } from "@webiny/ui/DataTable";
import { ISortController, ISortItemsController } from "../abstractions";

export class SortTrashBinController implements ISortController {
    private sortController: ISortController;
    private sortEntriesController: ISortItemsController;

    constructor(sortController: ISortController, sortEntriesController: ISortItemsController) {
        this.sortController = sortController;
        this.sortEntriesController = sortEntriesController;
        makeAutoObservable(this);
    }

    public execute: OnSortingChange = async updaterOrValue => {
        this.sortController.execute(updaterOrValue);
        await this.sortEntriesController.execute();
    };
}
