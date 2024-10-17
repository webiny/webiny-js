import { Folder } from "../Folder";

export interface IUpdateFolderRepository {
    execute: (folder: Folder) => Promise<void>;
}
