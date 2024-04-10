import { OnSortingChange } from "@webiny/ui/DataTable";
import { ColumnSorting, SortingMapper } from "@webiny/app-utils";
import { IListItemsUseCase, ISortItemsUseCase } from "~/UseCases";
import { ISortItemsController } from "./ISortItemsController";

export class SortItemsController implements ISortItemsController {
    private listItemsUseCaseFactory: () => IListItemsUseCase;
    private sortItemsUseCaseFactory: () => ISortItemsUseCase;

    constructor(
        listItemsUseCaseFactory: () => IListItemsUseCase,
        sortItemsUseCaseFactory: () => ISortItemsUseCase
    ) {
        this.listItemsUseCaseFactory = listItemsUseCaseFactory;
        this.sortItemsUseCaseFactory = sortItemsUseCaseFactory;
    }

    public execute: OnSortingChange = async updaterOrValue => {
        let newSorts: ColumnSorting[] = [];

        if (typeof updaterOrValue === "function") {
            newSorts = updaterOrValue(newSorts || []);
        }

        const sortItemsUseCase = this.sortItemsUseCaseFactory();
        const listItemsUseCase = this.listItemsUseCaseFactory();

        await sortItemsUseCase.execute(newSorts.map(sort => SortingMapper.fromColumnToDTO(sort)));
        await listItemsUseCase.execute();
    };
}
