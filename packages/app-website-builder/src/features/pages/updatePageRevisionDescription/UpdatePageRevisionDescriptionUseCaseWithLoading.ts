import { UpdatePageRevisionDescriptionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WbPageLoadingRepository } from "~/features/pages/shared/abstractions.js";
import { loadingActions } from "~/constants.js";

class UpdatePageRevisionDescriptionUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly loadingRepository: WbPageLoadingRepository.Interface,
        private readonly decoratee: UseCaseAbstraction.Interface
    ) {}

    public async execute(params: UseCaseAbstraction.Params) {
        await this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.publish
        );
    }
}

export const UpdatePageRevisionDescriptionUseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: UpdatePageRevisionDescriptionUseCaseWithLoadingImpl,
    dependencies: [WbPageLoadingRepository]
});
