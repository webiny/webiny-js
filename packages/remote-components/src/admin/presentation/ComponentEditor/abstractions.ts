import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { RemoteComponentDto } from "~/shared/types.js";

export interface IComponentEditorVm {
    loading: boolean;
    saving: boolean;
    bundling: boolean;
    refining: boolean;
    component: RemoteComponentDto | null;
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
}

export const ComponentEditorPresenter = createAbstraction<IComponentEditorPresenter>(
    "RemoteComponents/ComponentEditorPresenter"
);

export namespace ComponentEditorPresenter {
    export type Interface = IComponentEditorPresenter;
    export type ViewModel = IComponentEditorVm;
}
