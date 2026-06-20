import { CmsFieldRenderer } from "../abstractions.js";

class PassthroughRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "passthrough";
    formRenderer = "passthrough";
    name = "Passthrough Renderer";
    description = "Render child fields without any extra wrappers.";

    canUse() {
        return false;
    }
}

export const PassthroughRenderer = CmsFieldRenderer.createImplementation({
    implementation: PassthroughRendererImpl,
    dependencies: []
});
