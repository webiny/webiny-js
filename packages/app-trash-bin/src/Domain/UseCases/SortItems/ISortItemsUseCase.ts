import { SortingDTO } from "@webiny/app-utils";

export interface ISortItemsUseCase {
    execute: (sorts: SortingDTO[]) => Promise<void>;
}
