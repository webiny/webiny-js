import { Folder } from "~/folders/domain";

export interface IGetDescendantFoldersRepository {
    execute: (id: string) => Folder[];
}
