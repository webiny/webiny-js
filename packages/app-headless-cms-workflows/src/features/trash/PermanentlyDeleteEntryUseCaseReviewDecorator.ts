import { PermanentlyDeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import type { IPermanentlyDeleteEntryParams } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";

class PermanentlyDeleteEntryUseCaseReviewDecoratorImpl
    implements PermanentlyDeleteEntryUseCase.Interface
{
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private decoratee: PermanentlyDeleteEntryUseCase.Interface
    ) {}

    async execute(params: IPermanentlyDeleteEntryParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            useCases: this.useCases,
            revisionId: null
        });
    }
}

export const PermanentlyDeleteEntryUseCaseReviewDecorator =
    PermanentlyDeleteEntryUseCase.createDecorator({
        decorator: PermanentlyDeleteEntryUseCaseReviewDecoratorImpl,
        dependencies: [ActiveReviewGuard, CmsReviewUseCases]
    });
