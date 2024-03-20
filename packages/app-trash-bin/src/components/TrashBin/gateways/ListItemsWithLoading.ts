import { ITrashBinListGateway } from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ILoadingRepository } from "@webiny/app-utilities";
import { LoadingEnum } from "~/types";

export class ListItemsWithLoading implements ITrashBinListGateway<any> {
    private loadingRepository: ILoadingRepository;
    private listGateway: ITrashBinListGateway<any>;

    constructor(loadingRepository: ILoadingRepository, listGateway: ITrashBinListGateway<any>) {
        this.loadingRepository = loadingRepository;
        this.listGateway = listGateway;
    }

    async execute(params: TrashBinListQueryVariables) {
        const loadingKey = params.after ? LoadingEnum.listMore : LoadingEnum.list;
        return await this.loadingRepository.runCallBack(
            this.listGateway.execute(params),
            loadingKey
        );
    }
}
