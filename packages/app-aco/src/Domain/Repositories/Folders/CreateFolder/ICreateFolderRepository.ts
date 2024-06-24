import { FolderDTO } from "~/Domain/Models";

export interface ICreateFolderRepository {
    execute: (folder: FolderDTO) => Promise<void>;
}
