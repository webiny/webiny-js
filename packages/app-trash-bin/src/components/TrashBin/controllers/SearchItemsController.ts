import {
    ISearchItemsController,
    ITrashBinItemsRepository
} from "~/components/TrashBin/abstractions";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export class SearchItemsController implements ISearchItemsController {
    private repository: ITrashBinItemsRepository;

    constructor(repository: ITrashBinItemsRepository) {
        this.repository = repository;
    }

    async execute(params?: TrashBinListQueryVariables) {
        return await this.repository.listItems(true, params);
    }
}
