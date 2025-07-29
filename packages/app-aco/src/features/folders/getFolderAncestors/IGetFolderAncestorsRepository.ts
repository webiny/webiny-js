import type { Folder } from "~/features";

export interface IGetFolderAncestorsRepository {
    execute: (id: string) => Folder[];
}
