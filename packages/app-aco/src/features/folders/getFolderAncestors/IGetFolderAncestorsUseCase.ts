import type { FolderDto } from "./FolderDto.js";

export interface GetFolderAncestorsParams {
    id: string;
}

export interface IGetFolderAncestorsUseCase {
    execute: (params: GetFolderAncestorsParams) => FolderDto[];
}
