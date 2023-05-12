import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";

const pageModelPlugin = new CmsModelPlugin({
    locale: "en-US",
    lockedFields: [],
    modelId: "page",
    name: "Page",
    description: "",
    tenant: "root",
    titleFieldId: "title",
    singularApiName: "PageModelApiNameRef",
    pluralApiName: "PagesModelApiNameRefs",
    fields: [
        {
            fieldId: "title",
            helpText: null,
            id: "jf7h0jsc",
            label: "Title",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "text-input"
            },
            settings: {},
            type: "text",
            validation: []
        },
        {
            fieldId: "contentBlocks",
            helpText: null,
            id: "0kbfq0j6",
            label: "Content Blocks",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "object"
            },
            settings: {
                fields: [
                    {
                        fieldId: "blocks",
                        id: "lxza895k",
                        label: "Blocks",
                        renderer: {
                            name: "ref-input"
                        },
                        settings: {
                            models: [
                                {
                                    modelId: "faqGroupBanner"
                                },
                                {
                                    modelId: "faq"
                                }
                            ]
                        },
                        type: "ref",
                        validation: []
                    }
                ],
                layout: [["lxza895k"]]
            },
            type: "object",
            validation: []
        }
    ],
    group: {
        id: "62f39c13ebe1d800091bf33c",
        name: "Ungrouped"
    },
    layout: [["jf7h0jsc"], ["0kbfq0j6"]]
});

const faqModelPlugin = new CmsModelPlugin({
    lockedFields: [],
    modelId: "faq",
    name: "FAQ",
    titleFieldId: "id",
    locale: "en-US",
    description: "",
    singularApiName: "FaqModelApiNameRef",
    pluralApiName: "FaqsModelApiNameRefs",
    fields: [
        {
            fieldId: "question",
            helpText: null,
            id: "c8pphxf2",
            label: "Question",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "text-input"
            },
            settings: {},
            type: "text",
            validation: []
        },
        {
            fieldId: "answer",
            helpText: null,
            id: "477qeutg",
            label: "Answer",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "rich-text-input"
            },
            settings: {},
            type: "rich-text",
            validation: []
        },
        {
            fieldId: "image",
            helpText: null,
            id: "7jubpw3w",
            label: "Image",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "file-input"
            },
            settings: {
                imagesOnly: true
            },
            type: "file",
            validation: []
        }
    ],
    group: {
        id: "62f39c13ebe1d800091bf33c",
        name: "Ungrouped"
    },
    layout: [["c8pphxf2"], ["477qeutg"], ["7jubpw3w"]]
});

const faqGroupBannerModelPlugin = new CmsModelPlugin({
    locale: "en-US",
    lockedFields: [],
    modelId: "faqGroupBanner",
    name: "FAQ Group Banner",
    tenant: "root",
    titleFieldId: "id",
    description: "",
    singularApiName: "FaqGroupBannerModelApiNameRef",
    pluralApiName: "FaqsGroupBannersModelApiNameRefs",
    fields: [
        {
            fieldId: "eyebrowText",
            helpText: null,
            id: "iqe2aw2g",
            label: "Eyebrow Text",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "text-input"
            },
            settings: {},
            type: "text",
            validation: []
        },
        {
            fieldId: "heading",
            helpText: null,
            id: "25kvqahf",
            label: "Heading",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "text-input"
            },
            settings: {},
            type: "text",
            validation: []
        },
        {
            fieldId: "subHeading",
            helpText: null,
            id: "an0tmg81",
            label: "Sub Heading",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "text-input"
            },
            settings: {},
            type: "text",
            validation: []
        },
        {
            fieldId: "alternateBackgroundColor",
            helpText: null,
            id: "g4ei6uhp",
            label: "Alternate Background Color",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "boolean-input"
            },
            settings: {
                defaultValue: null
            },
            type: "boolean",
            validation: []
        },
        {
            fieldId: "isFaqItemCollapsable",
            helpText: null,
            id: "g98nz2mr",
            label: "Is FAQ Item Collapsable",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "boolean-input"
            },
            settings: {
                defaultValue: null
            },
            type: "boolean",
            validation: []
        },
        {
            fieldId: "customId",
            helpText: null,
            id: "t03jq8ke",
            label: "Custom ID",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "text-input"
            },
            settings: {},
            type: "text",
            validation: []
        },
        {
            fieldId: "faqGroup",
            helpText: null,
            id: "5f0dbgvi",
            label: "FAQ Group",
            listValidation: [],
            multipleValues: false,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "ref-input"
            },
            settings: {
                models: [
                    {
                        modelId: "faq"
                    }
                ]
            },
            type: "ref",
            validation: []
        }
    ],
    group: {
        id: "62f39c13ebe1d800091bf33c",
        name: "Ungrouped"
    },
    layout: [
        ["iqe2aw2g"],
        ["25kvqahf"],
        ["an0tmg81"],
        ["5f0dbgvi"],
        ["g4ei6uhp"],
        ["g98nz2mr"],
        ["t03jq8ke"]
    ]
});

describe("content model plugins - nested `ref` field union types", () => {
    const { introspect } = useGraphQLHandler({
        plugins: [pageModelPlugin, faqModelPlugin, faqGroupBannerModelPlugin],
        path: "read/en-US"
    });

    test("must generate valid schema for nested `ref` field union", async () => {
        const [, response] = await introspect();
        expect(response.statusCode).toBe(200);
    });
});
