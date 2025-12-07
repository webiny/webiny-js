import { createAbstraction } from "@webiny/feature/admin";
import type { FolderGqlDto } from "./FolderGqlDto.js";

export interface IListFoldersUseCase {
    execute: () => Promise<void>;
}

export interface IListFoldersRepository {
    execute: () => Promise<void>;
}

export interface IListFoldersGateway {
    execute: (type: string) => Promise<FolderGqlDto[]>;
}

export const ListFoldersUseCase = createAbstraction<IListFoldersUseCase>("ListFoldersUseCase");

export namespace ListFoldersUseCase {
    export type Interface = IListFoldersUseCase;
}

export const ListFoldersRepository =
    createAbstraction<IListFoldersRepository>("ListFoldersRepository");

export namespace ListFoldersRepository {
    export type Interface = IListFoldersRepository;
}

export const ListFoldersGateway = createAbstraction<IListFoldersGateway>("ListFoldersGateway");

export namespace ListFoldersGateway {
    export type Interface = IListFoldersGateway;
}
