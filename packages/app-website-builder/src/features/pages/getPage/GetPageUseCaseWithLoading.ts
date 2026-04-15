import { GetPageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WbPageLoadingRepository } from "~/features/pages/shared/abstractions.js";
import { loadingActions } from "~/constants.js";

class GetPageUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: WbPageLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params) {
        return await this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.get
        );
    }
}

export const GetPageUseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: GetPageUseCaseWithLoadingImpl,
    dependencies: [WbPageLoadingRepository]
});
