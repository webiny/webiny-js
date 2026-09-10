import { ModelFactory } from "webiny/api/cms/model";

class BannerModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: "siteBanner",
                    name: "Banner",
                    group: "ungrouped"
                })
                .description("Site and special offer banners.")
                .fields(fields => ({
                    name: fields
                        .text()
                        .renderer("textInput")
                        .label("Name")
                        .required("Name is required.")
                        .minLength(2)
                        .maxLength(100),
                    bannerTypes: fields
                        .dynamicZone()
                        .renderer("dynamicZone")
                        .label("Banner Type")
                        .template("siteBanner", {
                            name: "Site Banner",
                            gqlTypeName: "SiteBannerBlock",
                            fields: templateFields => ({
                                enabled: templateFields
                                    .boolean()
                                    .renderer("switch")
                                    .label("Enabled"),
                                text: templateFields
                                    .richText()
                                    .renderer("lexicalEditor")
                                    .label("Text"),
                                backgroundColor: templateFields
                                    .text()
                                    .renderer("dropdown")
                                    .label("Background Color")
                                    .predefinedValues([
                                        { label: "Teal: #009CA6", value: "#009CA6" },
                                        { label: "Navy: #00205B", value: "#00205B" },
                                        { label: "Yellow: #EDE04B", value: "#EDE04B" }
                                    ]),
                                additionalInformation: templateFields
                                    .boolean()
                                    .renderer("switch")
                                    .label("Additional Information")
                                    .description(
                                        "Enable this option to add additional information for the banner."
                                    ),
                                additionalInfoTab: templateFields
                                    .uiTabs()
                                    .label("Tab")
                                    .tab("Additional Information", {
                                        label: "Additional Information",
                                        description: "Additional information for the banner.",
                                        fields: tabFields => ({
                                            additionalInformationText: tabFields
                                                .richText()
                                                .renderer("lexicalEditor")
                                                .label("Additional Information Text")
                                        }),
                                        layout: [["additionalInformationText"]]
                                    })
                                    .rules([
                                        {
                                            type: "condition",
                                            target: "$.additionalInformation",
                                            operator: "!=",
                                            value: true,
                                            action: "hide"
                                        }
                                    ]),
                                global: templateFields
                                    .boolean()
                                    .renderer("switch")
                                    .label("Global")
                                    .description(
                                        "Global banners will be displayed on all pages of the website."
                                    ),
                                locationTab: templateFields
                                    .uiTabs()
                                    .label("Location")
                                    .tab("Location", {
                                        label: "Location",
                                        description: "Location for the banner.",
                                        fields: tabFields => ({
                                            location: tabFields
                                                .text()
                                                .label("Location")
                                                .renderer("textInput")
                                                .required("Location is required.")
                                        }),
                                        layout: [["location"]]
                                    })
                                    .rules([
                                        {
                                            type: "condition",
                                            target: "$.global",
                                            operator: "==",
                                            value: true,
                                            action: "hide"
                                        }
                                    ])
                            }),
                            layout: [
                                ["enabled"],
                                ["text"],
                                ["backgroundColor"],
                                ["additionalInformation"],
                                ["additionalInfoTab"],
                                ["global"],
                                ["locationTab"]
                            ]
                        })
                        .template("specialOfferBanner", {
                            name: "Special Offer Banner",
                            gqlTypeName: "SpecialOfferBannerBlock",
                            fields: templateFields => ({
                                enabled: templateFields
                                    .boolean()
                                    .renderer("switch")
                                    .label("Enabled"),
                                text: templateFields
                                    .richText()
                                    .renderer("lexicalEditor")
                                    .label("Text"),
                                ctaLabel: templateFields
                                    .text()
                                    .renderer("textInput")
                                    .label("CTA Label"),
                                ctaUrl: templateFields.text().renderer("textInput").label("CTA URL")
                            }),
                            layout: [["enabled"], ["text"], ["ctaLabel", "ctaUrl"]]
                        })
                }))
                .layout([["name"], ["bannerTypes"]])
                .titleFieldId("name")
                .singularApiName("Banner")
                .pluralApiName("Banners")
        ];
    }
}

export default ModelFactory.createImplementation({
    implementation: BannerModelImpl,
    dependencies: []
});
