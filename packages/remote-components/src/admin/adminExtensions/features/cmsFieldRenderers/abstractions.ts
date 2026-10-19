import { createAbstraction } from "@webiny/feature/admin";
import type { FieldRendererComponent } from "@webiny/app-admin/features/formModel/FormView.js";
import type { FieldRendererConfig } from "~/shared/adminExtensions/fieldRendererConfig.js";

/** A generated renderer, loaded and ready to register. */
export interface ILoadedFieldRenderer {
    name: string;
    label: string;
    description: string;
    config: FieldRendererConfig;
    /** The name the CMS stores on a field and the Appearance tab offers. */
    cmsRendererName: string;
    /** The name the form looks the component up by. */
    formRendererName: string;
    component: FieldRendererComponent;
}

export interface IGeneratedCmsFieldRenderers {
    /**
     * Makes the CMS offer exactly these renderers. Called after every load; a renderer missing from
     * the list is no longer offered, and a field already using it gets its type's default input.
     */
    sync(renderers: ILoadedFieldRenderer[]): void;
}

export const GeneratedCmsFieldRenderers = createAbstraction<IGeneratedCmsFieldRenderers>(
    "RemoteComponents/GeneratedCmsFieldRenderers"
);

export namespace GeneratedCmsFieldRenderers {
    export type Interface = IGeneratedCmsFieldRenderers;
    export type Loaded = ILoadedFieldRenderer;
}
