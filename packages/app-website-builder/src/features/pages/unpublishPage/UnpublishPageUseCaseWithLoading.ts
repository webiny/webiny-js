import type { ILoadingRepository } from "@webiny/app-utils";
import type {
    IUnpublishPageUseCase,
    UnpublishPageParams
} from "~/features/pages/unpublishPage/IUnpublishPageUseCase.js";
import { loadingActions } from "~/constants.js";

export class UnpublishPageUseCaseWithLoading implements IUnpublishPageUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IUnpublishPageUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IUnpublishPageUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: UnpublishPageParams) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            loadingActions.unpublish
        );
    }
}
