import { InputElement } from "@webiny/app-admin/elements/InputElement";
import { validation } from "@webiny/validation";
import { TextareaElement } from "@webiny/app-admin/elements/TextareaElement";
import { PageSettingsFormView } from "~/editor/views/PageSettingsView/PageSettingsFormView";
import { SelectElement } from "@webiny/app-admin/elements/SelectElement";
import { plugins } from "@webiny/plugins";
import { PbPageLayoutPlugin } from "~/types";
import { FileManagerElement } from "@webiny/app-admin/elements/FileManagerElement";
import { TagsMultiAutocompleteElement } from "~/editor/elements/TagsMultiAutocompletetElement";

export class GeneralSettingsView extends PageSettingsFormView {
    constructor() {
        super("GeneralSettingsView");

        this.setTitle("General Settings");

        // TODO: hidden field: <Bind name={"settings.social.meta"} />
        this.addField(
            new InputElement("title", {
                name: "title",
                label: "Title",
                description: "Page title.",
                validators: validation.create("required")
            })
        );

        this.addField(
            new InputElement("path", {
                name: "path",
                label: "Path",
                description: `For example: "/about-us". Must contain at least two characters.`,
                validators: validation.create("required,minLength:2")
            })
        );

        this.addField(
            new TextareaElement("snippet", {
                name: "settings.general.snippet",
                label: "Snippet",
                description: "Page snippet.",
                rows: 4
            })
        );

        this.addField(
            new SelectElement("layout", {
                name: "settings.general.layout",
                label: "Layout",
                description: "Render this page using the selected layout.",
                options: plugins.byType<PbPageLayoutPlugin>("pb-page-layout").map(pl => {
                    return { value: pl.layout.name, label: pl.layout.title };
                })
            })
        );

        this.addField(
            new TagsMultiAutocompleteElement("tags", {
                name: "settings.general.tags",
                label: "Tags",
                description: "Add tags to filter pages."
            })
        );

        this.addField(
            new FileManagerElement("image", {
                name: "settings.general.image",
                label: "Page Image",
                onChangePickAttributes: ["id", "src"]
            })
        );

        this.applyPlugins(GeneralSettingsView);
    }
}
