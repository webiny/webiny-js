import { FolderDto } from "./FolderDto";

export interface GetDescendantFoldersParams {
    id: string;
}

export interface IGetDescendantFoldersUseCase {
    execute: (params: GetDescendantFoldersParams) => FolderDto[];
}
