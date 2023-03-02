import { createAdvancedSingleRenderer } from "~/admin/plugins/fieldRenderers/ref/advanced/single";
import { createAdvancedMultipleRenderer } from "~/admin/plugins/fieldRenderers/ref/advanced/multiple";

export const createAdvancedRefRender = () => {
    return [createAdvancedSingleRenderer(), createAdvancedMultipleRenderer()];
};
