import { TenantModelExtension as ModelExtension } from "webiny/api/tenant-manager";

/* Extends the Tenant model with theme settings used by the funnel builder.
 * Fields are stored under tenant.extensions.theme. */
class TenantModelExtension implements ModelExtension.Interface {
    execute(extension: ModelExtension.Extension) {
        extension
            .fields(fields => ({
                theme: fields
                    .object()
                    .renderer("objectAccordionSingle")
                    .label("Theme")
                    .fields(themeFields => ({
                        primaryColor: themeFields
                            .text()
                            .label("Primary Color")
                            .description("Primary brand color (e.g. #ff0000).")
                            .renderer("textInput")
                            .defaultValue(""),
                        secondaryColor: themeFields
                            .text()
                            .label("Secondary Color")
                            .description("Secondary brand color (e.g. #0000ff).")
                            .renderer("textInput")
                            .defaultValue(""),
                        logo: themeFields
                            .text()
                            .label("Logo URL")
                            .description("URL of the tenant logo.")
                            .renderer("textInput")
                            .defaultValue("")
                    }))
                    .layout([["primaryColor"], ["secondaryColor"], ["logo"]])
            }))
            .layout([["theme"]]);
    }
}

export default ModelExtension.createImplementation({
    implementation: TenantModelExtension,
    dependencies: []
});
