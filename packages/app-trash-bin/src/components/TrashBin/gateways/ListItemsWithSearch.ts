import { ITrashBinListGateway } from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ISearchRepository } from "~/components/TrashBin/abstractions";

export class ListItemsWithSearch implements ITrashBinListGateway<any> {
    private searchRepository: ISearchRepository;
    private listGateway: ITrashBinListGateway<any>;

    constructor(searchRepository: ISearchRepository, listGateway: ITrashBinListGateway<any>) {
        this.searchRepository = searchRepository;
        this.listGateway = listGateway;
    }

    async execute(params: TrashBinListQueryVariables) {
        const query = this.searchRepository.get();
        return await this.listGateway.execute({ ...params, search: query || undefined });
    }
}
