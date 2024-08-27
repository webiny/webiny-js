import { Folder } from "~/folders/domain";
import { FolderItem } from "~/types";

export interface IFolderMapper {
    toDTO: (folder: Folder) => FolderItem;
}
