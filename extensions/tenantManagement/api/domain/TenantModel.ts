import { ModelFactory } from "webiny/api/cms/model";
import { TenantModelModifier } from "./TenantModelModifier.js";

export const TENANT_MODEL_ID = "tenant";

class TenantModelFactory implements ModelFactory.Interface {
    constructor(private modelModifiers: TenantModelModifier.Interface[]) {}

    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public()
            .modelId(TENANT_MODEL_ID)
            .name("Tenant")
            .description("Manage system tenants.")
            .group("hidden")
            .icon("fas/building")
            .singularApiName("Tenant")
            .pluralApiName("Tenants");

        model
            .fields(fields => ({
                name: fields
                    .text()
                    .label("Name")
                    .helpText("Enter a tenant name")
                    .required()
                    .renderer("text-input"),
                description: fields
                    .longText()
                    .label("Description")
                    .helpText("Enter a short tenant description")
                    .renderer("long-text-text-area")
                    .required(),
                theme: fields
                    .object()
                    .label("Theme")
                    .helpText("Configure the Admin app theme for this tenant.")
                    .renderer("object-accordion", { open: false })
                    .fields(fields => ({
                        websiteTitle: fields
                            .text()
                            .label("Website Title")
                            .helpText("Enter a website title")
                            .renderer("text-input"),
                        primaryColor: fields
                            .text()
                            .label("Primary Color")
                            .helpText("Enter a color code (e.g., #000000)")
                            .renderer("text-input")
                            .defaultValue([]),
                        additionalColors: fields
                            .text()
                            .list()
                            .label("Additional Colors")
                            .helpText("Enter a color code (e.g., #000000)")
                            .renderer("text-inputs", {
                                multiValue: {
                                    addValueButtonLabel: "Add Color"
                                }
                            }),
                        font: fields
                            .text()
                            .label("Font")
                            .helpText("Select a font")
                            .renderer("radio-buttons")
                            .predefinedValues([
                                {
                                    value: "InterVariable, sans-serif",
                                    label: "Inter"
                                },
                                {
                                    value: "Menlo, Consolas, Monaco, monospace",
                                    label: "Menlo"
                                },
                                {
                                    value: "Roboto, sans-serif",
                                    label: "Roboto"
                                }
                            ])
                    }))
                    .layout([["websiteTitle"], ["primaryColor"], ["additionalColors"], ["font"]]),
                isInstalled: fields
                    .boolean()
                    .label("Is installed?")
                    .renderer("hidden")
                    .defaultValue(false)
            }))
            .layout([["name"], ["description"], ["theme"], ["isInstalled"]]);

        for (const modifier of this.modelModifiers) {
            await modifier.execute(model);
        }

        return [model];
    }
}

export default ModelFactory.createImplementation({
    implementation: TenantModelFactory,
    dependencies: [[TenantModelModifier, { multiple: true }]]
});
