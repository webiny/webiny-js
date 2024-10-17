import { Folder } from "../Folder";

export interface IDeleteFolderRepository {
    execute: (folder: Folder) => Promise<void>;
}
