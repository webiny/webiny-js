import { ModelFactory } from "webiny/api/cms/model";

export const ARTICLE_MODEL_ID = "article";

class ArticleModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: ARTICLE_MODEL_ID,
                    name: "Article",
                    group: "ungrouped"
                })
                .description("Content model containing pages and articles.")
                .icon("far/newspaper")
                .fields(fields => ({
                    title: fields
                        .text()
                        .renderer("textInput")
                        .label("Title")
                        .required("Title is a required field."),
                    description: fields.longText().renderer("textarea").label("Description"),
                    slug: fields.text().renderer("textInput").label("Slug").help("Page slug."),
                    content: fields
                        .dynamicZone()
                        .renderer("dynamicZone")
                        .label("Content")
                        .list()
                        .listMinLength(1, "You must create at least 1 entries.")
                        .template("soi55qiv6zdpg5l46ag3q", {
                            name: "Hero",
                            gqlTypeName: "Hero",
                            icon: { type: "icon", name: "fas/grin-alt" },
                            description: "Hero banner",
                            fields: f => ({
                                title: f.text().renderer("textInput").label("Title"),
                                subtitle: f.text().renderer("textInput").label("Subtitle"),
                                description: f.longText().renderer("textarea").label("Description"),
                                image: f.file().imagesOnly().renderer("file").label("Image"),
                                callToActionButtonLabel: f
                                    .text()
                                    .renderer("textInput")
                                    .label("Call to action - Button Label"),
                                callToActionButtonUrl: f
                                    .text()
                                    .renderer("textInput")
                                    .label("Call to action - Button URL")
                            }),
                            layout: [
                                ["title"],
                                ["subtitle"],
                                ["description"],
                                ["image"],
                                ["callToActionButtonLabel"],
                                ["callToActionButtonUrl"]
                            ]
                        })
                        .template("4evd0r1hs67v6sy7lvp4d", {
                            name: "3-Grid Box",
                            gqlTypeName: "ThreeGridBox",
                            icon: { type: "icon", name: "fas/3" },
                            description: "Section with three boxes",
                            fields: f => ({
                                boxes: f
                                    .object()
                                    .label("Boxes")
                                    .list()
                                    .listMinLength(3, "You have to have three boxes exactly.")
                                    .listMaxLength(3, "You have to have three boxes exactly.")
                                    .renderer("objectAccordionMultiple")
                                    .fields(objFields => ({
                                        title: objFields
                                            .text()
                                            .renderer("textInput")
                                            .label("Title"),
                                        description: objFields
                                            .longText()
                                            .renderer("textarea")
                                            .label("Description"),
                                        icon: objFields
                                            .file()
                                            .imagesOnly()
                                            .renderer("file")
                                            .label("Icon")
                                    }))
                                    .layout([["title"], ["description"], ["icon"]])
                            }),
                            layout: [["boxes"]]
                        })
                        .template("s2mclt9b04geqrlofgwom", {
                            name: "Banner",
                            gqlTypeName: "Banner",
                            icon: { type: "icon", name: "fas/rectangle-ad" },
                            description: "Call out banner",
                            fields: f => ({
                                title: f.text().renderer("textInput").label("Title"),
                                actionLabel: f.text().renderer("textInput").label("Action - Label"),
                                actionUrl: f.text().renderer("textInput").label("Action - URL"),
                                image: f.file().imagesOnly().renderer("file").label("Image")
                            }),
                            layout: [["title"], ["actionLabel"], ["actionUrl"], ["image"]]
                        })
                        .template("42xjmo2vb2bgoz3e35xgs", {
                            name: "Rich text field",
                            gqlTypeName: "Richtextfield",
                            icon: { type: "icon", name: "fas/font" },
                            description: "Rich text field",
                            fields: f => ({
                                content: f.richText().renderer("lexicalEditor").label("Content")
                            }),
                            layout: [["content"]]
                        })
                }))
                .layout([["title"], ["description"], ["slug"], ["content"]])
                .titleFieldId("title")
                .descriptionFieldId("description")
                .singularApiName("Article")
                .pluralApiName("Articles")
                .settings({
                    aiEntryWizard: true,
                    previewSlug: "{values.slug}",
                    previewPrefix: "https://learn-webiny-nextjs-app.localhost/articles"
                })
        ];
    }
}

export const ArticleModel = ModelFactory.createImplementation({
    implementation: ArticleModelImpl,
    dependencies: []
});
