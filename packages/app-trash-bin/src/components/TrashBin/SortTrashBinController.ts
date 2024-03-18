import { makeAutoObservable } from "mobx";
import { ISortController, ITrashBinController } from "@webiny/app-trash-bin-common";
import { OnSortingChange } from "@webiny/ui/DataTable";

export class SortTrashBinController implements ISortController {
    private sortController: ISortController;
    private trashBinController: ITrashBinController;

    constructor(sortController: ISortController, trashBinController: ITrashBinController) {
        this.sortController = sortController;
        this.trashBinController = trashBinController;
        makeAutoObservable(this);
    }

    public execute: OnSortingChange = async updaterOrValue => {
        this.sortController.execute(updaterOrValue);
        await this.trashBinController.sortEntries();
    };
}
