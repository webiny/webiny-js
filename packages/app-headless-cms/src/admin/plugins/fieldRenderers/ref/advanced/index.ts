import { createAdvancedSingleRenderer } from "~/admin/plugins/fieldRenderers/ref/advanced/detailedReferenceRenderer";
import { createAdvancedMultipleRenderer } from "~/admin/plugins/fieldRenderers/ref/advanced/detailedReferencesRenderer";

export const createAdvancedRefRender = () => {
    return [createAdvancedSingleRenderer(), createAdvancedMultipleRenderer()];
};
