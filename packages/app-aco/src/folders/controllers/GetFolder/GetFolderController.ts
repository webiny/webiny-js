import { IGetFolderController } from "./IGetFolderController";
import { IGetFolderUseCase } from "~/folders/useCases";

export class GetFolderController implements IGetFolderController {
    private useCase: IGetFolderUseCase;

    constructor(useCase: IGetFolderUseCase) {
        this.useCase = useCase;
    }

    async execute(id: string) {
        await this.useCase.execute({ id });
    }
}
