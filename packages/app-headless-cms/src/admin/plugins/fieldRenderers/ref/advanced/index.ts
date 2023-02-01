import { createAdvancedSingleRenderer } from "~/admin/plugins/fieldRenderers/ref/advanced/single";

export const createAdvancedRefRender = () => {
    return [createAdvancedSingleRenderer()];
};
