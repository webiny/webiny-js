import { createAbstraction } from "@webiny/feature/admin";
import type { PreviewContext } from "~/features/previewAs/abstractions.js";
import type { PreviewAsUseCase } from "~/features/previewAs/abstractions.js";

export interface IPreviewOption {
    // `${type}:${id}`, so a single string identifies an option across both lists.
    value: string;
    label: string;
}

export interface IPreviewViewModel {
    loading: boolean;
    switching: boolean;
    roleOptions: IPreviewOption[];
    teamOptions: IPreviewOption[];
    activePreview: PreviewContext.Value | null;
    // Whether the signed-in user may start a preview at all. Mirrors the API's own rule.
    canPreview: boolean;
    error: string | null;
}

export interface IPreviewPresenter {
    readonly vm: IPreviewViewModel;
    load(): Promise<void>;
    // Picks one of the loaded options by its `value`. Does nothing before `load()` has run.
    previewAs(value: string): Promise<void>;
    // Previews a role or team the caller already knows, such as the one open in its edit form.
    previewTarget(target: PreviewAsUseCase.Target): Promise<void>;
    exit(): Promise<void>;
    dismissError(): void;
}

export const PreviewPresenter = createAbstraction<IPreviewPresenter>("PreviewPresenter");

export namespace PreviewPresenter {
    export type Interface = IPreviewPresenter;
    export type ViewModel = IPreviewViewModel;
    export type Option = IPreviewOption;
    export type Target = PreviewAsUseCase.Target;
}
