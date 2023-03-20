import { createContentModelGroup } from "./contentModelGroup";
import { CmsModel } from "~/types";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";

const { version: webinyVersion } = require("@webiny/cli/package.json");

const ids = {
    field11: generateAlphaNumericLowerCaseId(8),
    field12: generateAlphaNumericLowerCaseId(8)
};

const contentModelGroup = createContentModelGroup();

const models: CmsModel[] = [
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        titleFieldId: "title",
        lockedFields: [],
        name: "Category",
        description: "Product category",
        modelId: "category",
        singularApiName: "CategoryApiNameWhichIsABitDifferentThanModelId",
        pluralApiName: "CategoriesApiModel",
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
                storageId: `text@${ids.field11}`,
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
                storageId: `text@${ids.field12}`,
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
