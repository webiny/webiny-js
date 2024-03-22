import { makeAutoObservable } from "mobx";
import { IListMoreItemsUseCase } from "~/components/TrashBin/abstractions";
import { ILoadingRepository } from "@webiny/app-utils";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { LoadingActions } from "~/types";

export class ListMoreItemsUseCaseWithLoading implements IListMoreItemsUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IListMoreItemsUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IListMoreItemsUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute({ ...params }),
            LoadingActions.listMore
        );
    }
}
