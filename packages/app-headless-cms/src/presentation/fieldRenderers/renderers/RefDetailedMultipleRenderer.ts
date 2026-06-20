import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class RefDetailedMultipleRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "ref-advanced-multiple";
    formRenderer = "refDetailedMultiple";
    name = "Detailed view with modal search";
    description =
        "Renders preview cards of the selected records. User can browse through records using a modal dialog.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "ref" && !!field.list;
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            newItemPosition: fields
                .text()
                .label("New item position")
                .description("Where should the new items be added?")
                .options([
                    { label: "Top of the list", value: "first" },
                    { label: "Bottom of the list", value: "last" }
                ])
                .defaultValue("last")
        }));
        form.layout(layout => [layout.row("newItemPosition")]);
    }
}

export const RefDetailedMultipleRenderer = CmsFieldRenderer.createImplementation({
    implementation: RefDetailedMultipleRendererImpl,
    dependencies: []
});
