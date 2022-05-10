import shortId from "shortid";
import contentModelGroup from "./contentModelGroup";
import { CmsModel } from "~/types";

const { version: webinyVersion } = require("@webiny/cli/package.json");

const ids = {
    field11: shortId.generate(),
    field12: shortId.generate()
};

const models: CmsModel[] = [
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        titleFieldId: "title",
        lockedFields: [],
        name: "Category",
        description: "Product category",
        modelId: "category",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        layout: [[ids.field11], [ids.field12]],
        fields: [
            {
                id: ids.field11,
                multipleValues: false,
                helpText: "",
                label: "Title",
                type: "text",
                fieldId: "title",
                validation: [],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field12,
                multipleValues: false,
                helpText: "",
                label: "Slug",
                type: "text",
                fieldId: "slug",
                validation: [],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            }
        ],
        locale: "en-US",
        tenant: "root",
        webinyVersion
    }
];

export default models;
