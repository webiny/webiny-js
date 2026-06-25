import { PageSettingsGroup } from "../abstractions.js";

class SocialSettingsGroupImpl implements PageSettingsGroup.Interface {
    name = "social";
    label = "Social";
    description = "Control how this page is previewed when shared on social media.";
    icon = { type: "icon", name: "fas/thumbs-up" };

    buildForm(form: PageSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            title: fields
                .text()
                .label("Title")
                .description("Title for social platforms (og:title)"),
            description: fields
                .text()
                .label("Description")
                .description("Description for social platforms (og:description)")
                .renderer("textarea"),
            image: fields
                .file()
                .label("Image")
                .description("Select an image for social platforms (og:image)"),
            metaTags: fields
                .object()
                .label("Meta Tags")
                .description("Add more Open Graph tags")
                .renderer("keyValueTags")
                .fields(f => ({
                    property: f.text().placeholder("Property"),
                    content: f.text().placeholder("Content")
                }))
                .list()
        }));

        form.layout(layout => [
            layout.row("title"),
            layout.row("description"),
            layout.row("image"),
            layout.row("metaTags")
        ]);
    }

    mapToForm(doc: PageSettingsGroup.PageDocument): Record<string, any> {
        const social = doc.properties?.social ?? {};
        return {
            title: social.title,
            description: social.description,
            image: social.image,
            metaTags: social.metaTags
        };
    }

    mapFromForm(formData: Record<string, any>, doc: PageSettingsGroup.PageDocument): void {
        doc.properties.social = doc.properties.social ?? {};
        doc.properties.social.title = formData.title;
        doc.properties.social.description = formData.description;
        doc.properties.social.image = formData.image;
        doc.properties.social.metaTags = formData.metaTags;
    }
}

export const SocialSettingsGroup = PageSettingsGroup.createImplementation({
    implementation: SocialSettingsGroupImpl,
    dependencies: []
});
