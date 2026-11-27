import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { TenantModelExtension } from "./TenantModelExtension.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class TenantModelFactory implements ModelFactory.Interface {
    constructor(private extensions: TenantModelExtension.Interface[]) {}

    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({
                modelId: TENANT_MODEL_ID,
                name: "Tenant",
                group: "hidden"
            })
            .description("Manage system tenants.")
            .titleFieldId("name")
            .icon("fas/building")
            .singularApiName("Tenant")
            .pluralApiName("Tenants")
            .tags(["$publishing:false", "$hidden:true"]);

        model
            .fields(fields => ({
                name: fields
                    .text()
                    .label("Name")
                    .description("Enter a tenant name")
                    .required()
                    .renderer("textInput"),
                logo: fields
                    .file()
                    .imagesOnly()
                    .label("Logo")
                    .description(
                        "Shown next to the tenant's name in the admin navigation. Without a logo, the tenant's initials are shown."
                    ),
                description: fields
                    .longText()
                    .label("Description")
                    .description("Enter a short tenant description")
                    .renderer("textarea")
                    .required(),
                status: fields
                    .text()
                    .label("Status")
                    .defaultValue("disabled")
                    .renderer("hidden")
                    .predefinedValues([
                        {
                            value: "enabled",
                            label: "Enabled"
                        },
                        {
                            value: "disabled",
                            label: "Disabled"
                        }
                    ]),
                isInstalled: fields
                    .boolean()
                    .label("Is installed?")
                    .renderer("hidden")
                    .defaultValue(false),
                extensions: fields.object().renderer("passthrough")
            }))
            .layout([["name"], ["logo"], ["description"], ["extensions"]]);

        for (const modifier of this.extensions) {
            model.fields(fields => {
                const extensions = fields.extend().object();
                modifier.execute(extensions);

                return { extensions };
            });
        }

        return [model];
    }
}

export default ModelFactory.createImplementation({
    implementation: TenantModelFactory,
    dependencies: [[TenantModelExtension, { multiple: true }]]
});
