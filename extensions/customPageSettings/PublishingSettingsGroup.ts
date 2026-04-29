import { PageSettingsGroup } from "webiny/admin/website-builder/page/editor";

class PublishingSettingsGroupImpl implements PageSettingsGroup.Interface {
    name = "publishing";
    label = "Publishing";
    description = "Configure publishing schedule and visibility.";
    icon = { type: "icon", name: "fas/calendar-alt" };

    buildForm(form: PageSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            publishDate: fields.datetime().label("Publish date"),
            unpublishDate: fields.datetime().label("Unpublish date"),
            visibility: fields
                .text()
                .label("Visibility")
                .options([
                    { label: "Public", value: "public" },
                    { label: "Private", value: "private" },
                    { label: "Password Protected", value: "password" }
                ])
                .defaultValue("public")
                .afterChange((value, form) => {
                    const path = form.field("general.path").getValue<string>() ?? "";
                    if (value === "password") {
                        form.field("general.path").setValue(path + "/password");
                    } else {
                        form.field("general.path").setValue(path.replace("/password", ""));
                    }
                }),
            featured: fields.boolean().label("Featured page")
        }));

        form.layout(layout => [
            layout.row("publishDate", "unpublishDate"),
            layout.row("visibility"),
            layout.row("featured")
        ]);
    }

    mapToForm(doc: PageSettingsGroup.PageDocument): Record<string, any> {
        const publishing = doc.extensions?.publishing;
        return {
            publishDate: publishing?.publishDate ?? null,
            unpublishDate: publishing?.unpublishDate ?? null,
            visibility: publishing?.visibility ?? "public",
            featured: publishing?.featured ?? false
        };
    }

    mapFromForm(formData: Record<string, any>, doc: PageSettingsGroup.PageDocument): void {
        doc.extensions.publishing = doc.extensions.publishing ?? {};
        doc.extensions.publishing.publishDate = formData.publishDate;
        doc.extensions.publishing.unpublishDate = formData.unpublishDate;
        doc.extensions.publishing.visibility = formData.visibility;
        doc.extensions.publishing.featured = formData.featured;
    }
}

export const PublishingSettingsGroup = PageSettingsGroup.createImplementation({
    implementation: PublishingSettingsGroupImpl,
    dependencies: []
});
