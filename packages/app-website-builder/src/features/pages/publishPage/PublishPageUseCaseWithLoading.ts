import { PublishPageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WbPageLoadingRepository } from "~/features/pages/shared/abstractions.js";
import { loadingActions } from "~/constants.js";

class PublishPageUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: WbPageLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.publish
        );
    }
}

export const PublishPageUseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: PublishPageUseCaseWithLoadingImpl,
    dependencies: [WbPageLoadingRepository]
});
