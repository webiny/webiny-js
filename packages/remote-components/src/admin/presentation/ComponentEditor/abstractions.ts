import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { RemoteComponentDto } from "~/shared/types.js";
import type { ThemeSummary } from "~/admin/features/shared/abstractions.js";

export interface IComponentEditorVm {
    loading: boolean;
    saving: boolean;
    bundling: boolean;
    refining: boolean;
    component: RemoteComponentDto | null;
    /** Published themes the preview can be rendered under. */
    themeOptions: ThemeSummary[];
    /** The revision id of the theme being previewed, or null for the site's active theme. */
    selectedThemeId: string | null;
    /** The forced preview mode: "light", "dark", or "" for the theme's system default. */
    themeMode: string;
    /** Whether the previewed theme has a dark scheme — the light/dark toggle is hidden when it doesn't. */
    previewSupportsDarkMode: boolean;
    source: string;
    css: string;
    error: string | null;
    form: IFormVM;
    refineForm: IFormVM;
    bundleStale: boolean;
    lastBundledOn: string | null;
    sandbox: ISandboxVm | null;
}

export interface ISandboxVm {
    bundledJs: string;
    bundledCss: string;
    componentName: string;
    manifest: {
        name: string;
        inputs: any[];
        defaults?: { inputs?: Record<string, any>; styles?: Record<string, any> };
        applyDefaultStyles?: boolean;
    };
}

export interface IEditorProvider {
    getEditor(): any;
    setEditor(editor: any): void;
}

export const EditorProvider = createAbstraction<IEditorProvider>("RemoteComponents/EditorProvider");

export namespace EditorProvider {
    export type Interface = IEditorProvider;
}

export interface ISandboxPreviewEvents {
    isConnected: boolean;
    onConnect(callback: () => void): () => void;
    onConnected(messenger: any): void;
    sendBundle(params: { componentName: string; bundledJs: string; bundledCss: string }): void;
    sendLiveCss(params: { css: string; componentName: string }): void;
    /** Pushes the previewed theme's token CSS to the sandbox; "" clears it back to the active theme. */
    sendThemeCss(params: { css: string }): void;
    /** Forces the sandbox's light/dark mode; "" follows the theme's system default. */
    sendThemeMode(params: { mode: string }): void;
    sendDocument(): void;
    destroy(): void;
}

export const SandboxPreviewEvents = createAbstraction<ISandboxPreviewEvents>(
    "RemoteComponents/SandboxPreviewEvents"
);

export namespace SandboxPreviewEvents {
    export type Interface = ISandboxPreviewEvents;
}

export interface IComponentEditorPresenter {
    vm: IComponentEditorVm;
    init(id: string): Promise<void>;
    setSource(value: string): void;
    setCss(value: string): void;
    save(): Promise<void>;
    bundle(): Promise<void>;
    setDefaultInputs(bindings: Record<string, any>): void;
    resetInputs(): void;
    refine(): Promise<void>;
    onRefineResult(data: { source: string; css: string }): void;
    onRefineError(message: string): void;
    /** Preview the component under a specific theme version (revision id), or null for the active theme. */
    selectTheme(id: string | null): Promise<void>;
    /** Force the preview's light/dark mode ("light" | "dark" | "" for the theme's default). */
    setThemeMode(mode: string): void;
}

export const ComponentEditorPresenter = createAbstraction<IComponentEditorPresenter>(
    "RemoteComponents/ComponentEditorPresenter"
);

export namespace ComponentEditorPresenter {
    export type Interface = IComponentEditorPresenter;
    export type ViewModel = IComponentEditorVm;
}
