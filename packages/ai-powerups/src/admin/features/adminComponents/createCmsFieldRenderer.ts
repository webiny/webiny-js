import { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms/types.js";
import type { AdminComponent } from "./abstractions.js";

/**
 * Turns one stored component into the entry the field editor's Appearance list reads.
 *
 * Two registries have to agree for a generated renderer to be usable, and they are separate on
 * purpose: `AdminConfig.Form.FieldRenderer` maps a name to a component at render time, and
 * `CmsFieldRenderer` is the catalogue of what a field may be SET to. Registering only the first
 * leaves a renderer that works but cannot be chosen; only the second leaves an option that renders
 * nothing.
 *
 * `rendererName` and `formRenderer` are both the component's name. They are allowed to differ, and
 * for built-in renderers they usually do (`file-input` -> `cmsFilePicker`), but a generated renderer
 * has one name and no reason to carry two. Keeping them equal also means the stored value in a
 * model's field config reads as the thing the user picked.
 */
export const createCmsFieldRenderer = (component: AdminComponent) => {
    class GeneratedCmsFieldRendererImpl implements CmsFieldRenderer.Interface {
        readonly rendererName = component.name;
        readonly formRenderer = component.name;
        /* `name` is what the renderer list shows as the option's title. */
        readonly name = component.label || component.name;
        readonly description = component.description;

        canUse({ field }: { field: CmsModelField }) {
            if (field.type !== component.fieldType) {
                return false;
            }

            if (component.appliesTo === "list") {
                return Boolean(field.list);
            }

            if (component.appliesTo === "single") {
                return !field.list;
            }

            return true;
        }
    }

    return CmsFieldRenderer.createImplementation({
        implementation: GeneratedCmsFieldRendererImpl,
        dependencies: []
    });
};
