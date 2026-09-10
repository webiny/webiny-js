import { TenantModelExtension } from "webiny/api/tenant-manager";

const FONT_OPTIONS = [
    { label: "Inter", value: "Inter, sans-serif" },
    { label: "Roboto", value: "Roboto, sans-serif" },
    { label: "Open Sans", value: "Open Sans, sans-serif" },
    { label: "Lato", value: "Lato, sans-serif" },
    { label: "Montserrat", value: "Montserrat, sans-serif" },
    { label: "Poppins", value: "Poppins, sans-serif" },
    { label: "Raleway", value: "Raleway, sans-serif" },
    { label: "Nunito", value: "Nunito, sans-serif" },
    { label: "Playfair Display", value: "Playfair Display, serif" },
    { label: "Merriweather", value: "Merriweather, serif" }
];

class TenantThemeExtensionImpl implements TenantModelExtension.Interface {
    execute(extension: TenantModelExtension.Extension) {
        extension.fields(fields => ({
            websiteTitle: fields.text().renderer("textInput").label("Website Title"),
            font: fields.text().renderer("select").predefinedValues(FONT_OPTIONS).label("Font"),
            primaryColor: fields.text().renderer("textInput").label("Primary Color"),
            additionalColors: fields.text().list().renderer("textInputs").label("Additional Colors")
        }));

        extension.layout([["websiteTitle"], ["font"], ["primaryColor", "additionalColors"]]);
    }
}

export default TenantModelExtension.createImplementation({
    implementation: TenantThemeExtensionImpl,
    dependencies: []
});
