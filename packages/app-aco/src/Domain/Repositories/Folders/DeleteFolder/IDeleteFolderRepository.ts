import { FolderDTO } from "~/Domain/Models";

export interface IDeleteFolderRepository {
    execute: (folder: FolderDTO) => Promise<void>;
}
