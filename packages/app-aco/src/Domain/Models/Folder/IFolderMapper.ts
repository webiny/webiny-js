import { Folder, FolderDTO } from "./Folder";

export interface IFolderMapper {
    toDTO: (folder: Folder | FolderDTO) => FolderDTO;
}
