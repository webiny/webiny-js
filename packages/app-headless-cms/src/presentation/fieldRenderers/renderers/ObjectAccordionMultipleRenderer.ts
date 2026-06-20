import { CmsFieldRenderer } from "../abstractions.js";

class ObjectAccordionMultipleRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "object-accordion-multiple";
    formRenderer = "objectAccordion";
    name = "Accordion (Multiple)";
    description = "Renders fields within an accordion.";

    canUse() {
        return false;
    }
}

export const ObjectAccordionMultipleRenderer = CmsFieldRenderer.createImplementation({
    implementation: ObjectAccordionMultipleRendererImpl,
    dependencies: []
});
