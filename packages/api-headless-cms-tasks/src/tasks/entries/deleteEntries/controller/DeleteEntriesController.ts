import { IDeleteEntriesControllerTaskParams } from "~/types";
import { ITaskResponseResult } from "@webiny/tasks";
import { DeleteEntriesProcessEntriesChecker } from "./DeleteEntriesProcessEntriesChecker";
import { CreateDeleteEntriesTasks } from "./CreateDeleteEntriesTasks";

export class DeleteEntriesController {
    public async execute(params: IDeleteEntriesControllerTaskParams): Promise<ITaskResponseResult> {
        const { response, isAborted, input } = params;

        if (isAborted()) {
            return response.aborted();
        }

        if (input.processing) {
            const deleteEntriesProcessEntriesChecker = new DeleteEntriesProcessEntriesChecker();
            return await deleteEntriesProcessEntriesChecker.execute(params);
        }

        const createDeleteEntriesTasks = new CreateDeleteEntriesTasks();
        return createDeleteEntriesTasks.execute(params);
    }
}
