import { Folder } from "~/folders/domain";

export interface ICreateFolderRepository {
    execute: (folder: Folder) => Promise<void>;
}
