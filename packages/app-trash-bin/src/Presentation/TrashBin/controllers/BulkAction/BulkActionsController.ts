import { IBulkActionUseCase } from "~/UseCases";
import { IBulkActionsController } from "./IBulkActionsController";
import { TrashBinBulkActionsParams } from "~/types";

export class BulkActionsController implements IBulkActionsController {
    private readonly useCaseFactory: () => IBulkActionUseCase;
    private readonly action: string;

    constructor(useCaseFactory: () => IBulkActionUseCase, action: string) {
        this.useCaseFactory = useCaseFactory;
        this.action = action;
    }

    async execute(params: TrashBinBulkActionsParams) {
        const bulkActionUseCase = this.useCaseFactory();
        await bulkActionUseCase.execute(this.action, params);
    }
}
