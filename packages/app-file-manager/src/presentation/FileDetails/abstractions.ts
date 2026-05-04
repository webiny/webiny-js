import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { FmFile } from "../../features/shared/types.js";

// ---------------------------------------------------------------------------
// FileDetailsViewModel
// ---------------------------------------------------------------------------

export interface IFileDetailsViewModel {
    file: FmFile | null;
    loading: boolean;
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
    saveFile(): Promise<void>;
}

export const FileDetailsPresenter =
    createAbstraction<IFileDetailsPresenter>("FileDetailsPresenter");

export namespace FileDetailsPresenter {
    export type Interface = IFileDetailsPresenter;
    export type ViewModel = IFileDetailsViewModel;
}
