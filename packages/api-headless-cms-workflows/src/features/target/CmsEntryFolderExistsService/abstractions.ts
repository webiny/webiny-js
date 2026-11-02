import { createAbstraction } from "@webiny/feature/api";

export interface CmsEntryFolderExistsParams {
    id: string;
    /** ACO folder type, `cms:<modelId>`. */
    type: string;
}

export interface ICmsEntryFolderExistsService {
    /**
     * Whether a folder with this id and type exists. `false` for a type that is not
     * `cms:<modelId>`, a model the current identity cannot read, a private or unpublishable model,
     * a missing folder or a folder of another type. Throws when a model or folder read fails.
     */
    exists(params: CmsEntryFolderExistsParams): Promise<boolean>;
}

/**
 * Folder existence for the workflow editor's folder rules (D69, R125): the folder repository
 * without folder-level permissions, so it answers for folders the editor cannot open, and only a
 * boolean. The caller checks `editor`.
 */
export const CmsEntryFolderExistsService = createAbstraction<ICmsEntryFolderExistsService>(
    "CmsEntryFolderExistsService"
);

export namespace CmsEntryFolderExistsService {
    export type Interface = ICmsEntryFolderExistsService;
    export type Params = CmsEntryFolderExistsParams;
}
