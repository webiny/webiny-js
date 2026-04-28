import { PageSettingsGroup } from "../abstractions.js";

class GeneralSettingsGroupImpl implements PageSettingsGroup.Interface {
    name = "general";
    label = "General";
    description = "Configure the page's core details like title, path, snippet, and image.";
    icon = { type: "icon", name: "fas/cog" };

    buildForm(form: PageSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            title: fields.text().label("Page title").required(),
            path: fields.text().label("Path").required(),
            snippet: fields.text().label("Snippet").renderer("textarea"),
            image: fields
                .file()
                .label("Image")
                .description("Select an image to represent this page"),
            tags: fields
                .text()
                .label("Tags")
                .description("Add page tags. These can be used for page rendering, filtering, etc.")
                .renderer("tags")
                .list()
        }));

        form.layout(layout => [
            layout.row("title"),
            layout.row("path"),
            layout.row("snippet"),
            layout.row("image"),
            layout.row("tags")
        ]);
    }

    mapToForm(doc: PageSettingsGroup.PageDocument): Record<string, any> {
        return {
            title: doc.properties?.title,
            path: doc.properties?.path,
            snippet: doc.properties?.snippet,
            image: doc.properties?.image,
            tags: doc.properties?.tags
        };
    }

    mapFromForm(formData: Record<string, any>, doc: PageSettingsGroup.PageDocument): void {
        doc.properties.title = formData.title;
        doc.properties.path = formData.path;
        doc.properties.snippet = formData.snippet;
        doc.properties.image = formData.image;
        doc.properties.tags = formData.tags;
    }
}

export const GeneralSettingsGroup = PageSettingsGroup.createImplementation({
    implementation: GeneralSettingsGroupImpl,
    dependencies: []
});
