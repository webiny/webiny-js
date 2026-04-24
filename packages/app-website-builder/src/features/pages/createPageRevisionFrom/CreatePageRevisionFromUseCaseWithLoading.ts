import { CreatePageRevisionFromUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WbPageLoadingRepository } from "~/features/pages/shared/abstractions.js";
import { loadingActions } from "~/constants.js";

class CreatePageRevisionFromUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: WbPageLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params) {
        return await this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.createRevisionFrom
        );
    }
}

export const CreatePageRevisionFromUseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: CreatePageRevisionFromUseCaseWithLoadingImpl,
    dependencies: [WbPageLoadingRepository]
});
