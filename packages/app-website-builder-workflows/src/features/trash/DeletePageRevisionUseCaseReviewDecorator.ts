import { DeletePageRevisionUseCase } from "@webiny/app-website-builder/features/pages/deletePageRevision/abstractions.js";
import type { DeletePageRevisionParams } from "@webiny/app-website-builder/features/pages/deletePageRevision/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases/abstractions.js";

class DeletePageRevisionUseCaseReviewDecoratorImpl implements DeletePageRevisionUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: WbReviewUseCases.Interface,
        private decoratee: DeletePageRevisionUseCase.Interface
    ) {}

    async execute(params: DeletePageRevisionParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            useCases: this.useCases,
            revisionId: params.id
        });
    }
}

export const DeletePageRevisionUseCaseReviewDecorator = DeletePageRevisionUseCase.createDecorator({
    decorator: DeletePageRevisionUseCaseReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, WbReviewUseCases]
});
