import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "@webiny/app-utils";
import { IDeleteItemUseCase } from "~/components/TrashBin/abstractions";
import { LoadingActions } from "~/types";

export class DeleteItemsUseCaseWithLoading implements IDeleteItemUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IDeleteItemUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IDeleteItemUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        await this.loadingRepository.runCallBack(this.useCase.execute(id), LoadingActions.delete);
    }
}
