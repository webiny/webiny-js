import { Folder } from "~/Domain/Models";

export interface IGetDescendantFoldersRepository {
    execute: (id: string) => Folder[];
}
