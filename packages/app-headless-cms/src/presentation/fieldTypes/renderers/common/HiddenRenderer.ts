import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";

class HiddenRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "hidden";
    formRenderer = "hidden";
    name = "Hidden Field";
    description = "Hides the component from the UI.";

    canUse() {
        return true;
    }
}

export const HiddenRenderer = CmsFieldRenderer.createImplementation({
    implementation: HiddenRendererImpl,
    dependencies: []
});
