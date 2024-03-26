import { OnSortingChange } from "@webiny/ui/DataTable";
import { ColumnSorting, SortingMapper } from "@webiny/app-utils";
import { IListItemsUseCase, ISortItemsUseCase } from "~/Domain";
import { ISortItemsController } from "./ISortItemsController";

export class SortItemsController implements ISortItemsController {
    private listItemsUseCase: IListItemsUseCase;
    private sortItemsUseCase: ISortItemsUseCase;

    constructor(listItemsUseCase: IListItemsUseCase, sortItemsUseCase: ISortItemsUseCase) {
        this.listItemsUseCase = listItemsUseCase;
        this.sortItemsUseCase = sortItemsUseCase;
    }

    public execute: OnSortingChange = async updaterOrValue => {
        let newSorts: ColumnSorting[] = [];

        if (typeof updaterOrValue === "function") {
            newSorts = updaterOrValue(newSorts || []);
        }

        await this.sortItemsUseCase.execute(
            newSorts.map(sort => SortingMapper.fromColumnToDTO(sort))
        );
        await this.listItemsUseCase.execute();
    };
}
