import { IBulkActionUseCase } from "~/UseCases";
import { IBulkActionsController } from "./IBulkActionsController";
import { TrashBinBulkActionsParams } from "~/types";

export class BulkActionsController implements IBulkActionsController {
    private readonly useCaseFactory: () => IBulkActionUseCase;

    constructor(useCaseFactory: () => IBulkActionUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(params: TrashBinBulkActionsParams) {
        const bulkActionUseCase = this.useCaseFactory();
        await bulkActionUseCase.execute(params);
    }
}
