import { makeAutoObservable } from "mobx";
import { IListItemsUseCase } from "~/components/TrashBin/abstractions";
import { ILoadingRepository } from "@webiny/app-utils";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { LoadingActions } from "~/types";

export class ListItemsUseCaseWithLoading implements IListItemsUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IListItemsUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IListItemsUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute({ ...params }),
            LoadingActions.list
        );
    }
}
