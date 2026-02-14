import { createCmsGroupPlugin, createModelPlugin } from "~/plugins";

export const exportedGroupsAndModels = {
    groups: [
        {
            id: "64d4c105110b570008736515",
            name: "Blog",
            slug: "blog",
            description: null,
            icon: "fab/blogger-b"
        },
        {
            id: "64d4c105110b570008736516",
            name: "Machines",
            slug: "machines",
            description: null,
            icon: "fas/location-dot"
        }
    ],
    models: [
        {
            modelId: "article",
            name: "Article",
            group: "machines",
            icon: "far/newspaper",
            singularApiName: "Article",
            pluralApiName: "Articles",
            fields: [
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Title",
                    type: "text",
                    tags: [],
                    placeholder: null,
                    id: "s0due9k2",
                    validation: [{ name: "required", message: "Value is required.", settings: {} }],
                    storageId: "text@s0due9k2",
                    fieldId: "title"
                },
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "long-text-text-area" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Description",
                    type: "long-text",
                    tags: [],
                    placeholder: null,
                    id: "f0aqavgm",
                    validation: [],
                    storageId: "long-text@f0aqavgm",
                    fieldId: "description"
                },
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "lexical-text-input" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Body",
                    type: "rich-text",
                    tags: [],
                    placeholder: null,
                    id: "jkldufuq",
                    validation: [],
                    storageId: "rich-text@jkldufuq",
                    fieldId: "body"
                },
                {
                    list: false,
                    listValidation: [],
                    settings: { models: [{ modelId: "author" }] },
                    renderer: { name: "ref-advanced-single" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Author",
                    type: "ref",
                    tags: [],
                    placeholder: null,
                    id: "ucuyyn1j",
                    validation: [],
                    storageId: "ref@ucuyyn1j",
                    fieldId: "author"
                },
                {
                    list: true,
                    listValidation: [],
                    settings: { models: [{ modelId: "category" }] },
                    renderer: { name: "ref-advanced-multiple" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Categories",
                    type: "ref",
                    tags: [],
                    placeholder: null,
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
            group: "blog",
            icon: "fas/person",
            singularApiName: "Author",
            pluralApiName: "Authors",
            fields: [
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Name",
                    type: "text",
                    tags: [],
                    placeholder: null,
                    id: "dtaqd9fp",
                    validation: [{ name: "required", message: "Value is required.", settings: {} }],
                    storageId: "text@dtaqd9fp",
                    fieldId: "name"
                },
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "long-text-text-area" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "About",
                    type: "long-text",
                    tags: [],
                    placeholder: null,
                    id: "2sof6i8i",
                    validation: [],
                    storageId: "long-text@2sof6i8i",
                    fieldId: "about"
                },
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "lexical-text-input" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Biography",
                    type: "rich-text",
                    tags: [],
                    placeholder: null,
                    id: "n6uxjar7",
                    validation: [],
                    storageId: "rich-text@n6uxjar7",
                    fieldId: "biography"
                },
                {
                    list: false,
                    listValidation: [],
                    settings: { type: "date" },
                    renderer: { name: "date-time-input" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Date Of Birth",
                    type: "datetime",
                    tags: [],
                    placeholder: null,
                    id: "w44xgwwr",
                    validation: [],
                    storageId: "datetime@w44xgwwr",
                    fieldId: "dateOfBirth"
                },
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "boolean-input" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Is Married",
                    type: "boolean",
                    tags: [],
                    placeholder: null,
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
            group: "machines",
            icon: "fas/location-dot",
            singularApiName: "Category",
            pluralApiName: "Categories",
            fields: [
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Title",
                    type: "text",
                    tags: [],
                    placeholder: null,
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
            group: "machines",
            icon: "fas/location-dot",
            singularApiName: "Machine",
            pluralApiName: "Machine",
            fields: [
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    description: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Title",
                    type: "text",
                    tags: [],
                    placeholder: null,
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
        createCmsGroupPlugin({
            id: "64d4c105110b570008736516",
            name: "Machines",
            slug: "machines",
            description: null,
            icon: "fas/location-dot"
        }),
        createModelPlugin({
            modelId: "machines",
            name: "Machines",
            group: "machines",
            icon: "fas/location-dot",
            singularApiName: "Machine",
            pluralApiName: "Machines",
            description: "",
            fields: [
                {
                    list: false,
                    listValidation: [],
                    settings: {},
                    renderer: { name: "text-input" },
                    help: null,
                    predefinedValues: { enabled: false, values: [] },
                    label: "Title",
                    type: "text",
                    tags: [],
                    placeholder: null,
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
