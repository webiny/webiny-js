import { WebinyError } from "@webiny/error";
import { Path } from "~/utils/Path.js";
import { Permissions, ROOT_FOLDER } from "@webiny/shared-aco";
import type { CreateFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { FolderLevelPermission as IFolderLevelPermission } from "~/flp/flp.types.js";
import type { Folder } from "~/folder/folder.types.js";
import type { AcoContext } from "~/types.js";

export class CreateFlpUseCase implements UseCaseAbstraction.Interface {
    constructor(private context: AcoContext) {}

    async execute(folder: Folder): Promise<void> {
        try {
            const { id, type, slug, parentId, permissions } = folder;
            let parentFlp: IFolderLevelPermission | null = null;

            if (parentId) {
                parentFlp = await this.context.aco.flp.get(parentId);

                if (!parentFlp) {
                    throw new WebinyError(
                        "Parent folder level permission not found. Unable to create a new record in the FLP catalog.",
                        "ERROR_CREATE_FLP_USE_CASE_PARENT_FLP_NOT_FOUND"
                    );
                }
            }

            await this.context.aco.flp.create({
                id,
                type,
                slug,
                parentId: parentId ?? ROOT_FOLDER,
                path: Path.create(slug, parentFlp?.path),
                permissions: Permissions.create(permissions, parentFlp)
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while creating FLP",
                code: "ERROR_CREATE_FLP_USE_CASE"
            });
        }
    }
}
