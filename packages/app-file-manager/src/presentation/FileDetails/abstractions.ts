import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { FmFile } from "../../features/shared/types.js";

// ---------------------------------------------------------------------------
// FileDetailsViewModel
// ---------------------------------------------------------------------------

export interface IFileDetailsViewModel {
    file: FmFile | null;
    loading: string | null;
    form: IFormVM;
    previewUrl: string | null;
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
    };
}

// ---------------------------------------------------------------------------
// IFileDetailsPresenter
// ---------------------------------------------------------------------------

export interface IFileDetailsPresenter {
    vm: IFileDetailsViewModel;
    loadFile(id: string): Promise<void>;
    saveFile(): Promise<boolean>;
    /** Replace the currently displayed file (e.g. after an out-of-band update). */
    setFile(file: FmFile): void;
    /**
     * Put accepted enrichment values into the open form as PENDING edits — dirty, unsaved, written
     * only when the user presses Update. Needed because the form is built once in `loadFile`, so
     * patching the files LIST cache, which is all the websocket handler does, never reaches an open
     * drawer.
     */
    applyEnrichment(enrichment: { tags: string[]; description: string }): void;
}

export const FileDetailsPresenter =
    createAbstraction<IFileDetailsPresenter>("FileDetailsPresenter");

export namespace FileDetailsPresenter {
    export type Interface = IFileDetailsPresenter;
    export type ViewModel = IFileDetailsViewModel;
}
