import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export interface IFileModelProvider {
    getModel(): Promise<CmsModel>;
}

export const FileModelProvider = createAbstraction<IFileModelProvider>("FileModelProvider");

export namespace FileModelProvider {
    export type Interface = IFileModelProvider;
}

export interface IGetFileModelRepository {
    load(): Promise<void>;
    getModel(): CmsModel | undefined;
    hasModel(): boolean;
}

export const GetFileModelRepository =
    createAbstraction<IGetFileModelRepository>("GetFileModelRepository");

export namespace GetFileModelRepository {
    export type Interface = IGetFileModelRepository;
}

export interface IGetFileModelGateway {
    execute(): Promise<CmsModel>;
}

export const GetFileModelGateway = createAbstraction<IGetFileModelGateway>("GetFileModelGateway");

export namespace GetFileModelGateway {
    export type Interface = IGetFileModelGateway;
}
