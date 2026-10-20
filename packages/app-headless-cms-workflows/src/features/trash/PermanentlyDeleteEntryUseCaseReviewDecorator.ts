import { PermanentlyDeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import type { IPermanentlyDeleteEntryParams } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";

class PermanentlyDeleteEntryUseCaseReviewDecoratorImpl
    implements PermanentlyDeleteEntryUseCase.Interface
{
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private decoratee: PermanentlyDeleteEntryUseCase.Interface
    ) {}

    async execute(params: IPermanentlyDeleteEntryParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            revisionId: null
        });
    }
}

export const PermanentlyDeleteEntryUseCaseReviewDecorator =
    PermanentlyDeleteEntryUseCase.createDecorator({
        decorator: PermanentlyDeleteEntryUseCaseReviewDecoratorImpl,
        dependencies: [ActiveReviewGuard]
    });
