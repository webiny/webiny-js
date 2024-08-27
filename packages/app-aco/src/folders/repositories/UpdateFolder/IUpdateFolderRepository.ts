import { Folder } from "~/folders/domain";

export interface IUpdateFolderRepository {
    execute: (folder: Folder) => Promise<void>;
}
