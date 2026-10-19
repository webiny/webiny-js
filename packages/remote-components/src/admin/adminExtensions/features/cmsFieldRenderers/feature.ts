import { createFeature } from "@webiny/feature/admin";
import { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";
import { GeneratedCmsFieldRenderers } from "./abstractions.js";
import { GeneratedCmsFieldRenderersImpl } from "./GeneratedCmsFieldRenderers.js";

export const GeneratedCmsFieldRenderersFeature = createFeature({
    name: "RemoteComponents/GeneratedCmsFieldRenderers",
    register(container) {
        /*
         * Entries go into the container the CMS form builder and the field editor read, which is
         * why registration happens here rather than in the class: renderers appear after sign-in,
         * long after the CMS registered its own.
         */
        const renderers = new GeneratedCmsFieldRenderersImpl(renderer => {
            container.registerInstance(CmsFieldRenderer, renderer);
        });
        container.registerInstance(GeneratedCmsFieldRenderers, renderers);
    }
});
