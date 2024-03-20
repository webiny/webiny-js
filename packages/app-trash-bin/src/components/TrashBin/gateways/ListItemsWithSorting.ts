import { ITrashBinListGateway } from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ISortingRepository, SortingMapper } from "@webiny/app-utilities";

export class ListItemsWithSorting implements ITrashBinListGateway<any> {
    private sortingRepository: ISortingRepository;
    private listGateway: ITrashBinListGateway<any>;

    constructor(sortingRepository: ISortingRepository, listGateway: ITrashBinListGateway<any>) {
        this.sortingRepository = sortingRepository;
        this.listGateway = listGateway;
    }

    async execute(params: TrashBinListQueryVariables) {
        const sort = this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoDb(sort));
        return await this.listGateway.execute({ ...params, sort });
    }
}
