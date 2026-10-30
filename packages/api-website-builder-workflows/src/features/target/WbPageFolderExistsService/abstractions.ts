import { createAbstraction } from "@webiny/feature/api";

export interface IWbPageFolderExistsService {
    /**
     * Whether a `wb:page` folder with this id exists. A missing folder, another folder type or an
     * id that is no folder id (empty, or with `#`) answer `false`; a failed read throws.
     */
    exists(folderId: string): Promise<boolean>;
}

/**
 * The dangling-folder check of the workflow editor (D69, R125): reads the folder with ACO's
 * repository, without folder-level permissions, and answers only a boolean, never folder data.
 * The caller checks `editor` first (`WebsiteBuilderPageFolderExistsUseCase`).
 */
export const WbPageFolderExistsService = createAbstraction<IWbPageFolderExistsService>(
    "WbPageFolderExistsService"
);

export namespace WbPageFolderExistsService {
    export type Interface = IWbPageFolderExistsService;
}
