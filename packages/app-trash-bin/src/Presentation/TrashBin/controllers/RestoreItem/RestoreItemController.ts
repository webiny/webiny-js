import { IRestoreItemUseCase } from "~/Domain";
import { IRestoreItemController } from "./IRestoreItemController";

export class RestoreItemController implements IRestoreItemController {
    private restoreItemUseCase: IRestoreItemUseCase;

    constructor(restoreItemUseCase: IRestoreItemUseCase) {
        this.restoreItemUseCase = restoreItemUseCase;
    }

    async execute(id: string) {
        await this.restoreItemUseCase.execute(id);
    }
}
