import { Folder } from "../Folder";

export interface IGetDescendantFoldersRepository {
    execute: (id: string) => Folder[];
}
