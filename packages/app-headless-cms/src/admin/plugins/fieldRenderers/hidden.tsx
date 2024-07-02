import { CmsModelFieldRendererPlugin } from "~/types";

export const hiddenFieldRenderer: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-hidden",
    renderer: {
        rendererName: "hidden",
        name: "Hidden Field",
        description: `Hides the component from the UI.`,
        canUse() {
            return true;
        },
        render() {
            return null;
        }
    }
};
