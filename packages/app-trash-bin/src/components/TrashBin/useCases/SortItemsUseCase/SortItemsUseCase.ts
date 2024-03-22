import { makeAutoObservable } from "mobx";
import { ISortingRepository, SortingMapper } from "@webiny/app-utils";
import { OnSortingChange } from "@webiny/ui/DataTable";
import { ISortItemsUseCase, ITrashBinItemsRepository } from "../../abstractions";

export class SortItemsUseCase implements ISortItemsUseCase {
    private itemsRepository: ITrashBinItemsRepository;
    private sortingRepository: ISortingRepository;

    constructor(itemsRepository: ITrashBinItemsRepository, sortingRepository: ISortingRepository) {
        this.itemsRepository = itemsRepository;
        this.sortingRepository = sortingRepository;
        makeAutoObservable(this);
    }

    public execute: OnSortingChange = async updaterOrValue => {
        let newSorts = this.sortingRepository
            .get()
            .map(sort => SortingMapper.fromDTOtoColumn(sort));

        if (typeof updaterOrValue === "function") {
            newSorts = updaterOrValue(newSorts || []);
        }

        this.sortingRepository.set(newSorts.map(sort => SortingMapper.fromColumnToDTO(sort)));
        await this.itemsRepository.listItems();
    };
}
