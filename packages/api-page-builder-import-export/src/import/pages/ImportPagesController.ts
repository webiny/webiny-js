import { ITaskResponseResult } from "@webiny/tasks";
import { IImportPagesControllerTaskParams } from "./types";

export class ImportPagesController {
    public async execute({
        response
    }: IImportPagesControllerTaskParams): Promise<ITaskResponseResult> {
        return response.done();
    }
}
