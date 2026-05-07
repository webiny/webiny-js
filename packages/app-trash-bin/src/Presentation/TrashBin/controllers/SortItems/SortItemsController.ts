import type { OnDataTableSortingChange } from "@webiny/admin-ui";
import type { ColumnSorting } from "@webiny/app-utils";
import { SortingMapper } from "@webiny/app-utils";
import type { IListItemsUseCase, ISortItemsUseCase } from "~/UseCases/index.js";
import type { ISortItemsController } from "./ISortItemsController.js";

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

    public execute: OnDataTableSortingChange = async updaterOrValue => {
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
