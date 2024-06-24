import { FolderDTO } from "~/Domain/Models";

export interface IUpdateFolderRepository {
    execute: (folder: FolderDTO) => Promise<void>;
}
