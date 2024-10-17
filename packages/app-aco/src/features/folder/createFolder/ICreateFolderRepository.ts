import { Folder } from "../Folder";

export interface ICreateFolderRepository {
    execute: (folder: Folder) => Promise<void>;
}
