import { DeletePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WbPageLoadingRepository } from "~/features/pages/shared/abstractions.js";
import { loadingActions } from "~/constants.js";

class DeletePageUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: WbPageLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.delete
        );
    }
}

export const DeletePageUseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: DeletePageUseCaseWithLoadingImpl,
    dependencies: [WbPageLoadingRepository]
});
