import { makeAutoObservable } from "mobx";
import { OnSortingChange } from "@webiny/ui/DataTable";
import { ISortController, ISortItemsController } from "../abstractions";

export class SortTrashBinController implements ISortController {
    private sortController: ISortController;
    private sortItemsController: ISortItemsController;

    constructor(sortController: ISortController, sortItemsController: ISortItemsController) {
        this.sortController = sortController;
        this.sortItemsController = sortItemsController;
        makeAutoObservable(this);
    }

    public execute: OnSortingChange = async updaterOrValue => {
        this.sortController.execute(updaterOrValue);
        await this.sortItemsController.execute();
    };
}
