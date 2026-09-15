import { ModelFactory } from "webiny/api/cms/model";

export const FIELD_RULES_MODEL_ID = "fieldRulesTest";

class FieldRulesModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: FIELD_RULES_MODEL_ID,
                    name: "Field Rules Test",
                    group: "ungrouped"
                })
                .description("Test model for field rules defined via code")
                .fields(fields => ({
                    status: fields
                        .text()
                        .renderer("radioButtons")
                        .label("Status")
                        .required()
                        .predefinedValues([
                            { label: "Draft", value: "draft" },
                            { label: "Published", value: "published" }
                        ]),
                    title: fields
                        .text()
                        .renderer("textInput")
                        .label("Title")
                        .required()
                        .rules([
                            {
                                type: "accessControl",
                                target: "identity",
                                operator: "matches",
                                value: "team:marketing",
                                action: "disable"
                            }
                        ]),
                    seo: fields
                        .object()
                        .renderer("objectAccordionSingle")
                        .label("SEO")
                        .rules([
                            {
                                type: "condition",
                                target: "status",
                                operator: "!=",
                                value: "published",
                                action: "hide"
                            }
                        ])
                        .fields(sub => ({
                            seoTitle: sub.text().renderer("textInput").label("SEO Title"),
                            seoDescription: sub
                                .longText()
                                .renderer("textarea")
                                .label("SEO Description")
                                .rules([
                                    {
                                        type: "condition",
                                        target: "seo.seoTitle",
                                        operator: "isEmpty",
                                        value: null,
                                        action: "disable"
                                    }
                                ])
                        }))
                        .layout([["seoTitle"], ["seoDescription"]]),
                    separator: fields
                        .uiSeparator()
                        .label("Admin Section")
                        .rules([
                            {
                                type: "accessControl",
                                target: "identity",
                                operator: "matches",
                                value: "team:admins",
                                action: "hide"
                            }
                        ]),
                    alert: fields
                        .uiAlert()
                        .label("This content is in draft mode.")
                        .alertType("warning")
                        .rules([
                            {
                                type: "condition",
                                target: "status",
                                operator: "==",
                                value: "published",
                                action: "hide"
                            }
                        ]),
                    tabs: fields
                        .uiTabs()
                        .tab("content", {
                            label: "Content",
                            fields: sub => ({
                                body: sub.richText().renderer("lexicalEditor").label("Body")
                            }),
                            layout: [["body"]]
                        })
                        .tab("advanced", {
                            label: "Advanced",
                            fields: sub => ({
                                slug: sub.text().renderer("textInput").label("Slug").unique()
                            }),
                            layout: [["slug"]],
                            rules: [
                                {
                                    type: "accessControl",
                                    target: "identity",
                                    operator: "matches",
                                    value: "team:developers",
                                    action: "hide"
                                }
                            ]
                        })
                        .rules([
                            {
                                type: "condition",
                                target: "title",
                                operator: "isEmpty",
                                value: null,
                                action: "hide"
                            }
                        ])
                }))
                .layout([["status"], ["title"], ["alert"], ["seo"], ["separator"], ["tabs"]])
                .titleFieldId("title")
                .singularApiName("FieldRulesTest")
                .pluralApiName("FieldRulesTests")
        ];
    }
}

export const FieldRulesModel = ModelFactory.createImplementation({
    implementation: FieldRulesModelImpl,
    dependencies: []
});
