import { ITrashBinDeleteItemGateway } from "@webiny/app-trash-bin-common";
import { ILoadingRepository } from "@webiny/app-utilities";
import { LoadingEnum } from "~/types";

export class DeleteItemWithLoading implements ITrashBinDeleteItemGateway {
    private loadingRepository: ILoadingRepository;
    private deleteGateway: ITrashBinDeleteItemGateway;

    constructor(loadingRepository: ILoadingRepository, deleteGateway: ITrashBinDeleteItemGateway) {
        this.loadingRepository = loadingRepository;
        this.deleteGateway = deleteGateway;
    }

    async execute(id: string) {
        return await this.loadingRepository.runCallBack(
            this.deleteGateway.execute(id),
            LoadingEnum.delete
        );
    }
}
