import { TenantModelExtension as ModelExtension } from "@webiny/tenant-manager/api/domain/TenantModelExtension.js";

class TenantModelExtension implements ModelExtension.Interface {
    execute(extension: ModelExtension.Extension) {
        extension
            .fields(fields => ({
                websiteTheme: fields
                    .object()
                    .label("Website Theme")
                    .description("Configure a Website Builder theme for this tenant.")
                    .renderer("object-accordion", { open: false })
                    .fields(fields => ({
                        websiteTitle: fields
                            .text()
                            .label("Website Title")
                            .description("Enter a website title")
                            .renderer("text-input"),
                        primaryColor: fields
                            .text()
                            .label("Primary Color")
                            .description("Enter a color code (e.g., #000000)")
                            .renderer("text-input")
                            .defaultValue(""),
                        additionalColors: fields
                            .text()
                            .list()
                            .label("Additional Colors")
                            .description("Enter a color code (e.g., #000000)")
                            .defaultValue([])
                            .renderer("text-inputs", {
                                multiValue: {
                                    addValueButtonLabel: "Add Color"
                                }
                            }),
                        font: fields
                            .text()
                            .label("Font")
                            .description("Select a font")
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
                    .layout([["websiteTitle"], ["primaryColor"], ["additionalColors"], ["font"]])
            }))
            .layout(layout => {
                layout.addRow(["websiteTheme"]);
            });
    }
}

export default ModelExtension.createImplementation({
    implementation: TenantModelExtension,
    dependencies: []
});
