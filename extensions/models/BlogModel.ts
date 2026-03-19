import { ModelFactory } from "webiny/api/cms/model";

export const BLOG_MODEL_ID = "blog";

class BlogModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: BLOG_MODEL_ID,
                    name: "Blog",
                    group: "blog"
                })
                .icon("far/newspaper")
                .description("Blog posts")
                .fields(fields => ({
                    title: fields
                        .text()
                        .renderer("textInput")
                        .label("Title")
                        .required("Title is required"),
                    slug: fields
                        .text()
                        .renderer("textInput")
                        .label("Slug")
                        .required("Slug is required")
                        .unique("Slug must be unique"),
                    shortDescription: fields
                        .longText()
                        .renderer("textarea")
                        .label("Short Description"),
                    featured: fields.boolean().renderer("switch").label("Featured"),
                    seo: fields
                        .object()
                        .renderer("objectAccordionSingle")
                        .label("SEO")
                        .fields(seoFields => ({
                            title: seoFields.text().renderer("textInput").label("SEO Title"),
                            description: seoFields
                                .longText()
                                .renderer("textarea")
                                .label("SEO Description"),
                            keywords: seoFields.text().renderer("textInput").label("SEO Keywords")
                        }))
                        .layout([["title"], ["description"], ["keywords"]]),
                    coverImage: fields.file().imagesOnly().renderer("file").label("Cover Image"),
                    content: fields
                        .dynamicZone()
                        .renderer("dynamicZone")
                        .label("Legacy Content")
                        .description("Used only for content migrations")
                        .template("legacyMdx", {
                            name: "Legacy MDX",
                            gqlTypeName: "LegacyMdx",
                            description: "Legacy MDX markdown content",
                            fields: f => ({
                                markdown: f.longText().renderer("textarea").label("Markdown")
                            }),
                            layout: [["markdown"]]
                        })
                        .template("markdownTextBox", {
                            name: "Markdown Text Box",
                            gqlTypeName: "MarkdownTextBox",
                            description: "Markdown content block",
                            fields: f => ({
                                markdown: f.longText().renderer("textarea").label("Markdown")
                            }),
                            layout: [["markdown"]]
                        }),
                    newContent: fields
                        .dynamicZone()
                        .renderer("dynamicZone")
                        .label("New Content")
                        .list()
                        .template("richText", {
                            name: "Rich Text",
                            gqlTypeName: "RichText",
                            description: "Rich text content block",
                            fields: f => ({
                                content: f.richText().renderer("lexicalEditor").label("Content")
                            }),
                            layout: [["content"]]
                        })
                        .template("faq", {
                            name: "FAQ",
                            gqlTypeName: "FAQ",
                            description: "Frequently asked questions block",
                            fields: f => ({
                                title: f.text().renderer("textInput").label("Title"),
                                questionsAnswers: f
                                    .object()
                                    .renderer("objectAccordionMultiple")
                                    .label("Questions & Answers")
                                    .list()
                                    .fields(qaFields => ({
                                        question: qaFields
                                            .text()
                                            .renderer("textInput")
                                            .label("Question"),
                                        answer: qaFields
                                            .richText()
                                            .renderer("lexicalEditor")
                                            .label("Answer")
                                    }))
                                    .layout([["question"], ["answer"]])
                            }),
                            layout: [["title"], ["questionsAnswers"]]
                        })
                        .template("markdown", {
                            name: "Markdown",
                            gqlTypeName: "Markdown",
                            description: "Markdown content block",
                            fields: f => ({
                                markdown: f.longText().renderer("textarea").label("Markdown")
                            }),
                            layout: [["markdown"]]
                        }),
                    author: fields
                        .ref()
                        .renderer("refDialogSingle")
                        .label("Author")
                        .models([{ modelId: "author" }])
                }))
                .layout([
                    ["title"],
                    ["slug", "featured"],
                    ["shortDescription"],
                    ["coverImage"],
                    ["author"],
                    ["seo"],
                    ["content"],
                    ["newContent"]
                ])
                .titleFieldId("title")
                .singularApiName("Blog")
                .pluralApiName("Blogs")
        ];
    }
}

export const BlogModel = ModelFactory.createImplementation({
    implementation: BlogModelImpl,
    dependencies: []
});
