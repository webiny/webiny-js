import { Folder } from "./Folder";
import { FolderItem } from "~/types";

export interface IFolderMapper {
    toDTO: (folder: Folder | FolderItem) => FolderItem;
}
