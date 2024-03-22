import { DeleteItemController } from "./DeleteItemController";
import { ListItemsController } from "./ListItemsController";
import { ListMoreItemsController } from "./ListMoreItemsController";
import { SelectItemsController } from "./SelectItemsController";
import { SortItemsController } from "./SortItemsController";
import { SearchItemsController } from "./SearchItemsController";
import { ITrashBinUseCases } from "~/components/TrashBin/abstractions";
import { ITrashBinUseControllers } from "~/components/TrashBin/abstractions/ITrashBinControllers";

export const getControllers = (useCases: ITrashBinUseCases): ITrashBinUseControllers => {
    const listItems = new ListItemsController(useCases.listItemsUseCase);
    const listMoreItems = new ListMoreItemsController(useCases.listMoreItemsUseCase);
    const deleteItem = new DeleteItemController(useCases.deleteItemUseCase);
    const selectItems = new SelectItemsController(useCases.selectItemsUseCase);
    const sortItems = new SortItemsController(useCases.listItemsUseCase, useCases.sortItemsUseCase);
    const searchItems = new SearchItemsController(
        useCases.listItemsUseCase,
        useCases.searchItemsUseCase
    );

    return {
        listItems,
        listMoreItems,
        deleteItem,
        searchItems,
        sortItems,
        selectItems
    };
};
