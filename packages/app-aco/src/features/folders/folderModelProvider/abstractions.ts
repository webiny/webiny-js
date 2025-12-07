import { createAbstraction } from "@webiny/feature/admin";
import type { FolderModelDto } from "./FolderModelDto.js";

export interface IGetFolderModelUseCase {
    execute: () => Promise<void>;
}

export interface IGetFolderModelRepository {
    load: () => Promise<void>;
    getModel: () => FolderModelDto | undefined;
    hasModel: () => boolean;
}

export interface IGetFolderModelGateway {
    execute: () => Promise<FolderModelDto>;
}

export const GetFolderModelRepository = createAbstraction<IGetFolderModelRepository>(
    "GetFolderModelRepository"
);

export namespace GetFolderModelRepository {
    export type Interface = IGetFolderModelRepository;
}

export const GetFolderModelGateway = createAbstraction<IGetFolderModelGateway>(
    "GetFolderModelGateway"
);

export namespace GetFolderModelGateway {
    export type Interface = IGetFolderModelGateway;
}
