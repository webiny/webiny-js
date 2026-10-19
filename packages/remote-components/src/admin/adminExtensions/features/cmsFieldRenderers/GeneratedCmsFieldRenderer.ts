import type { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms/types.js";
import type { GeneratedCmsFieldRenderers } from "./abstractions.js";
import type { FieldRendererConfig } from "~/shared/adminExtensions/fieldRendererConfig.js";
import { defaultFormRenderer } from "./defaultFormRenderer.js";
import { toCmsRendererName } from "~/shared/adminExtensions/fieldRendererRuntime.js";

/**
 * The CMS catalogue entry for one generated renderer name.
 *
 * Registered once and never removed, because the container cannot remove a registration. It reads
 * the current state instead: while the renderer is loaded it is offered and used; once it is
 * disabled or deleted it is no longer offered, and a field that still names it falls back to its
 * type's default input rather than to nothing.
 */
export class GeneratedCmsFieldRenderer implements CmsFieldRenderer.Interface {
    readonly rendererName: string;

    constructor(
        private readonly extensionName: string,
        private readonly getLoaded: () => GeneratedCmsFieldRenderers.Loaded | undefined,
        private readonly getLastConfig: () => FieldRendererConfig
    ) {
        this.rendererName = toCmsRendererName(extensionName);
    }

    get formRenderer(): string {
        const loaded = this.getLoaded();
        if (loaded) {
            return loaded.formRendererName;
        }
        return defaultFormRenderer(this.getLastConfig());
    }

    get name(): string {
        return this.getLoaded()?.label ?? this.extensionName;
    }

    get description(): string {
        return this.getLoaded()?.description ?? "";
    }

    canUse({ field }: { field: CmsModelField }): boolean {
        const loaded = this.getLoaded();
        if (!loaded) {
            return false;
        }
        return (
            field.type === loaded.config.fieldType && !!field.list === loaded.config.multipleValues
        );
    }
}
