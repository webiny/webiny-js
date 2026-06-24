import { WebinyError } from "@webiny/error";
import type { DeleteFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { Folder } from "~/folder/folder.types.js";
import type { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";

export class DeleteFlpUseCase implements UseCaseAbstraction.Interface {
    constructor(private flpCrud: AcoFlpCrud.Interface) {}

    async execute(folder: Folder): Promise<void> {
        try {
            if (!folder) {
                throw new WebinyError(
                    "Missing `folder` from the task input, I can't delete the record from the FLP catalog.",
                    "ERROR_DELETE_FLP_USE_CASE_FOLDER_NOT_PROVIDED",
                    { folder }
                );
            }
            await this.flpCrud.delete(folder.id);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while deleting FLP",
                code: "ERROR_DELETE_FLP_USE_CASE"
            });
        }
    }
}
