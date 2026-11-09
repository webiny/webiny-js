// Headless folder use cases. `FoldersFeature` registers them for one folder type (its context), in a
// container of the caller's choosing. The gateway abstractions are exported so tests can register
// their own implementations.
export { FoldersFeature } from "~/features/folders/feature.js";
export { FoldersCache } from "~/features/folders/abstractions.js";
export {
    ListFoldersUseCase,
    ListFoldersGateway
} from "~/features/folders/listFolders/abstractions.js";
export {
    CreateFolderUseCase,
    CreateFolderGateway
} from "~/features/folders/createFolder/abstractions.js";
export type { Folder } from "~/domain/folder/Folder.js";
export type { FolderDto } from "~/domain/folder/FolderDto.js";
