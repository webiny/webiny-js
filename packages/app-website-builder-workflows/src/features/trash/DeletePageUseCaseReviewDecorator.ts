import { DeletePageUseCase } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import type { DeletePageParams } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";

class DeletePageUseCaseReviewDecoratorImpl implements DeletePageUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private decoratee: DeletePageUseCase.Interface
    ) {}

    async execute(params: DeletePageParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            revisionId: null
        });
    }
}

export const DeletePageUseCaseReviewDecorator = DeletePageUseCase.createDecorator({
    decorator: DeletePageUseCaseReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard]
});
