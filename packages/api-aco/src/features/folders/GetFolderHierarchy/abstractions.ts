import { createAbstraction } from "@webiny/feature/api";
import type {
    GetFolderHierarchyParams,
    GetFolderHierarchyResponse
} from "~/folder/folder.types.js";

// Use Case Abstraction
export interface IGetFolderHierarchyUseCase {
    execute: (params: GetFolderHierarchyParams) => Promise<GetFolderHierarchyResponse>;
}

export const GetFolderHierarchyUseCase = createAbstraction<IGetFolderHierarchyUseCase>(
    "GetFolderHierarchyUseCase"
);

export namespace GetFolderHierarchyUseCase {
    export type Interface = IGetFolderHierarchyUseCase;
}
