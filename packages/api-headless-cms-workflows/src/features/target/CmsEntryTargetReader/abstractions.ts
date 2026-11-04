import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface CmsEntryTargetReadParams {
    /** Namespace id, e.g. "cms.article". */
    model: string;
    targetRevisionId: string;
}

export interface CmsEntryTargetsReadParams {
    /** Namespace id, e.g. "cms.article". */
    model: string;
    targetRevisionIds: string[];
}

export interface CmsEntryTarget {
    model: CmsModel;
    /** The model's group, read as the current identity; group read is part of entry access (R72). */
    group: CmsGroup;
    entry: CmsEntry;
}

export interface ICmsEntryTargetReader {
    /**
     * Reads the revision as the current identity. `null` when the namespace is not `cms.*`, the
     * model or its group does not exist or cannot be read, the model is private, or the revision
     * does not exist (a trashed revision reads as missing). Other failures are thrown.
     */
    read(params: CmsEntryTargetReadParams): Promise<CmsEntryTarget | null>;
    /**
     * Reads many revisions of one model in one batch read, as the current identity, in no
     * particular order. A revision that does not exist (or is trashed) is left out; `[]` when the
     * model or group cannot be read, the model is private or the identity has no entry
     * permission on it. Other failures are thrown.
     */
    readMany(params: CmsEntryTargetsReadParams): Promise<CmsEntryTarget[]>;
}

/** Loads a CMS target revision for the `cms.*` adapter and wrappers (R47). */
export const CmsEntryTargetReader =
    createAbstraction<ICmsEntryTargetReader>("CmsEntryTargetReader");

export namespace CmsEntryTargetReader {
    export type Interface = ICmsEntryTargetReader;
    export type Params = CmsEntryTargetReadParams;
    export type ManyParams = CmsEntryTargetsReadParams;
    export type Target = CmsEntryTarget;
}
