import { createCmsGroup, createCmsModel } from "~/plugins";

export const exportedGroupsAndModels = {
    groups: [
        {
            id: "64d4c105110b570008736515",
            name: "Blog",
            slug: "blog",
            description: null,
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            }
        },
        {
            id: "64d4c105110b570008736516",
            name: "Machines",
            slug: "machines",
            description: null,
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            }
        }
    ],
    models: [
        {
            modelId: "article",
            name: "Article",
            group: "64d4c105110b570008736515",
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            },
            singularApiName: "Article",
            pluralApiName: "Articles",
            fields: [
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Title",
                    type: "text",
                    tags: [],
                    placeholderText: null,
                    id: "s0due9k2",
                    validation: [{ name: "required", message: "Value is required.", settings: {} }],
                    storageId: "text@s0due9k2",
                    fieldId: "title"
                },
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "long-text-text-area" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Description",
                    type: "long-text",
                    tags: [],
                    placeholderText: null,
                    id: "f0aqavgm",
                    validation: [],
                    storageId: "long-text@f0aqavgm",
                    fieldId: "description"
                },
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "lexical-text-input" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Body",
                    type: "rich-text",
                    tags: [],
                    placeholderText: null,
                    id: "jkldufuq",
                    validation: [],
                    storageId: "rich-text@jkldufuq",
                    fieldId: "body"
                },
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: { models: [{ modelId: "author" }] },
                    renderer: { name: "ref-advanced-single" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Author",
                    type: "ref",
                    tags: [],
                    placeholderText: null,
                    id: "ucuyyn1j",
                    validation: [],
                    storageId: "ref@ucuyyn1j",
                    fieldId: "author"
                },
                {
                    multipleValues: true,
                    listValidation: [],
                    settings: { models: [{ modelId: "category" }] },
                    renderer: { name: "ref-advanced-multiple" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Categories",
                    type: "ref",
                    tags: [],
                    placeholderText: null,
                    id: "d5zkt06f",
                    validation: [],
                    storageId: "ref@d5zkt06f",
                    fieldId: "categories"
                }
            ],
            layout: [["s0due9k2"], ["f0aqavgm"], ["jkldufuq"], ["ucuyyn1j", "d5zkt06f"]],
            titleFieldId: "title",
            descriptionFieldId: "description"
        },
        {
            modelId: "author",
            name: "Author",
            group: "64d4c105110b570008736515",
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            },
            singularApiName: "Author",
            pluralApiName: "Authors",
            fields: [
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Name",
                    type: "text",
                    tags: [],
                    placeholderText: null,
                    id: "dtaqd9fp",
                    validation: [{ name: "required", message: "Value is required.", settings: {} }],
                    storageId: "text@dtaqd9fp",
                    fieldId: "name"
                },
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "long-text-text-area" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "About",
                    type: "long-text",
                    tags: [],
                    placeholderText: null,
                    id: "2sof6i8i",
                    validation: [],
                    storageId: "long-text@2sof6i8i",
                    fieldId: "about"
                },
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "lexical-text-input" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Biography",
                    type: "rich-text",
                    tags: [],
                    placeholderText: null,
                    id: "n6uxjar7",
                    validation: [],
                    storageId: "rich-text@n6uxjar7",
                    fieldId: "biography"
                },
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: { type: "date" },
                    renderer: { name: "date-time-input" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Date Of Birth",
                    type: "datetime",
                    tags: [],
                    placeholderText: null,
                    id: "w44xgwwr",
                    validation: [],
                    storageId: "datetime@w44xgwwr",
                    fieldId: "dateOfBirth"
                },
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "boolean-input" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Is Married",
                    type: "boolean",
                    tags: [],
                    placeholderText: null,
                    id: "b2a35yc7",
                    validation: [],
                    storageId: "boolean@b2a35yc7",
                    fieldId: "isMarried"
                }
            ],
            layout: [["dtaqd9fp"], ["2sof6i8i"], ["n6uxjar7"], ["w44xgwwr", "b2a35yc7"]],
            titleFieldId: "name",
            descriptionFieldId: "about"
        },
        {
            modelId: "category",
            name: "Category",
            group: "64d4c105110b570008736515",
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            },
            singularApiName: "Category",
            pluralApiName: "Categories",
            fields: [
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Title",
                    type: "text",
                    tags: [],
                    placeholderText: null,
                    id: "3oqcch5d",
                    validation: [
                        { name: "required", message: "Title is a required field.", settings: {} }
                    ],
                    storageId: "text@3oqcch5d",
                    fieldId: "title"
                }
            ],
            layout: [["3oqcch5d"]],
            titleFieldId: "title"
        },
        {
            modelId: "machines",
            name: "Machines",
            group: "64d4c105110b570008736516",
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            },
            singularApiName: "Machine",
            pluralApiName: "Machine",
            fields: [
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Title",
                    type: "text",
                    tags: [],
                    placeholderText: null,
                    id: "a13r8hgds",
                    validation: [
                        { name: "required", message: "Title is a required field.", settings: {} }
                    ],
                    storageId: "text@3oqcch5d",
                    fieldId: "title"
                }
            ],
            layout: [["a13r8hgds"]],
            titleFieldId: "title"
        }
    ]
};

export const createModels = () => {
    return [
        createCmsGroup({
            id: "64d4c105110b570008736516",
            name: "Machines",
            slug: "machines",
            description: null,
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            }
        }),
        createCmsModel({
            modelId: "machines",
            name: "Machines",
            group: {
                id: "64d4c105110b570008736516",
                name: "Machines"
            },
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            },
            singularApiName: "Machine",
            pluralApiName: "Machines",
            description: "",
            fields: [
                {
                    multipleValues: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    helpText: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Title",
                    type: "text",
                    tags: [],
                    placeholderText: null,
                    id: "a13r8hgds",
                    validation: [
                        { name: "required", message: "Title is a required field.", settings: {} }
                    ],
                    fieldId: "title"
                }
            ],
            layout: [["a13r8hgds"]],
            titleFieldId: "title"
        })
    ];
};
