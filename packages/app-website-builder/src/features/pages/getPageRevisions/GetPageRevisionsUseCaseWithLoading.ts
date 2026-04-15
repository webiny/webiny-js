import { GetPageRevisionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WbPageRevisionsLoadingRepository } from "~/features/pages/shared/abstractions.js";
import { loadingActions } from "~/constants.js";

class GetPageRevisionsUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: WbPageRevisionsLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params) {
        return await this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.get
        );
    }
}

export const GetPageRevisionsUseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: GetPageRevisionsUseCaseWithLoadingImpl,
    dependencies: [WbPageRevisionsLoadingRepository]
});
