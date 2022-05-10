import contentModelGroup from "./contentModelGroup";
import { CmsModel } from "~/types";
import { generateAlphaNumericId } from "@webiny/utils";

const { version: webinyVersion } = require("@webiny/cli/package.json");

const ids = {
    field11: generateAlphaNumericId(),
    field12: generateAlphaNumericId()
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
                fieldId: `title@text@${ids.field11}`,
                alias: "title",
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
                fieldId: `slug@text@${ids.field12}`,
                alias: "slug",
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
