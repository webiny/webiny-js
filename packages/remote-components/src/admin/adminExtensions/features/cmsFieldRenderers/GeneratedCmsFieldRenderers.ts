import type { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";
import { GeneratedCmsFieldRenderers as Abstraction } from "./abstractions.js";
import { GeneratedCmsFieldRenderer } from "./GeneratedCmsFieldRenderer.js";
import type { FieldRendererConfig } from "~/shared/adminExtensions/fieldRendererConfig.js";

export class GeneratedCmsFieldRenderersImpl implements Abstraction.Interface {
    private loaded = new Map<string, Abstraction.Loaded>();
    // The last config seen per name, so a field can fall back once its renderer is gone.
    private lastConfigs = new Map<string, FieldRendererConfig>();

    constructor(private readonly register: (renderer: CmsFieldRenderer.Interface) => void) {}

    sync(renderers: Abstraction.Loaded[]): void {
        this.loaded = new Map(renderers.map(renderer => [renderer.name, renderer]));

        for (const renderer of renderers) {
            const isNew = !this.lastConfigs.has(renderer.name);
            this.lastConfigs.set(renderer.name, renderer.config);
            if (isNew) {
                this.register(this.createEntry(renderer.name));
            }
        }
    }

    private createEntry(name: string): GeneratedCmsFieldRenderer {
        return new GeneratedCmsFieldRenderer(
            name,
            () => this.loaded.get(name),
            () => this.lastConfigs.get(name)!
        );
    }
}
