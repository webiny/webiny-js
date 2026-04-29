import { PageSettingsGroup } from "~/modules/pages/PageEditor/PageSettings/abstractions.js";

class SchemaSettingsGroupImpl implements PageSettingsGroup.Interface {
    name = "schema";
    label = "Schema";
    description = "Add structured data markup to enhance search result appearance.";
    icon = { type: "icon", name: "fas/code" };

    buildForm(form: PageSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            structuredSchema: fields
                .text()
                .label("Structured Schema")
                .defaultValue("")
                .renderer("codeEditor", { language: "html", height: 400 })
        }));

        form.layout(layout => [layout.row("structuredSchema")]);
    }

    mapToForm(doc: PageSettingsGroup.PageDocument): Record<string, any> {
        return {
            structuredSchema: doc.properties?.seo?.structuredSchema ?? ""
        };
    }

    mapFromForm(formData: Record<string, any>, doc: PageSettingsGroup.PageDocument): void {
        doc.properties.seo = doc.properties.seo ?? {};
        doc.properties.seo.structuredSchema = formData.structuredSchema;
    }
}

export const SchemaSettingsGroup = PageSettingsGroup.createImplementation({
    implementation: SchemaSettingsGroupImpl,
    dependencies: []
});
