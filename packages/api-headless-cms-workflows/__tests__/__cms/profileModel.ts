import { createModelPlugin } from "@webiny/api-headless-cms";

/** The review namespace of the profile model. */
export const PROFILE_NAMESPACE = "cms.profile";

/**
 * A code model for the CMS target editor tests: writable scalars, a nested object (two levels
 * deep, with a read-only reference `address.landlord` and a read-only multiple-values text
 * `address.labels` inside it, so a write next to them can prove they survive, Review Focus 3), a
 * multiple-values text, a multiple-values object and a reference (R172). `name` is
 * required and `age` must be at least 0, so the CMS validators have something to refuse.
 */
export const profileModel = {
    modelId: "profile",
    name: "Profile",
    group: "default",
    titleFieldId: "name",
    description: "",
    icon: null,
    singularApiName: "Profile",
    pluralApiName: "Profiles",
    layout: [
        ["name"],
        ["bio"],
        ["age"],
        ["active"],
        ["joinedOn"],
        ["birthday"],
        ["address"],
        ["tags"],
        ["contacts"],
        ["employer"]
    ],
    fields: [
        {
            id: "name",
            storageId: "text@name",
            fieldId: "name",
            type: "text",
            label: "Name",
            validation: [{ name: "required", message: "Name is required." }],
            listValidation: []
        },
        {
            id: "bio",
            storageId: "long-text@bio",
            fieldId: "bio",
            type: "long-text",
            label: "Bio",
            validation: [],
            listValidation: []
        },
        {
            id: "age",
            storageId: "number@age",
            fieldId: "age",
            type: "number",
            label: "Age",
            validation: [
                { name: "gte", message: "Age must be 0 or more.", settings: { value: 0 } }
            ],
            listValidation: []
        },
        {
            id: "active",
            storageId: "boolean@active",
            fieldId: "active",
            type: "boolean",
            label: "Active",
            validation: [],
            listValidation: []
        },
        {
            id: "joinedOn",
            storageId: "datetime@joinedOn",
            fieldId: "joinedOn",
            type: "datetime",
            label: "Joined on",
            settings: { type: "dateTimeWithoutTimezone" },
            validation: [],
            listValidation: []
        },
        {
            id: "birthday",
            storageId: "datetime@birthday",
            fieldId: "birthday",
            type: "datetime",
            label: "Birthday",
            settings: { type: "date" },
            validation: [],
            listValidation: []
        },
        {
            id: "address",
            storageId: "object@address",
            fieldId: "address",
            type: "object",
            label: "Address",
            validation: [],
            listValidation: [],
            settings: {
                layout: [["street"], ["zip"], ["location"], ["landlord"], ["labels"]],
                fields: [
                    {
                        id: "street",
                        storageId: "text@street",
                        fieldId: "street",
                        type: "text",
                        label: "Street",
                        validation: [],
                        listValidation: []
                    },
                    {
                        id: "zip",
                        storageId: "number@zip",
                        fieldId: "zip",
                        type: "number",
                        label: "Zip",
                        validation: [],
                        listValidation: []
                    },
                    {
                        id: "location",
                        storageId: "object@location",
                        fieldId: "location",
                        type: "object",
                        label: "Location",
                        validation: [],
                        listValidation: [],
                        settings: {
                            layout: [["label"]],
                            fields: [
                                {
                                    id: "label",
                                    storageId: "text@label",
                                    fieldId: "label",
                                    type: "text",
                                    label: "Label",
                                    validation: [],
                                    listValidation: []
                                }
                            ]
                        }
                    },
                    {
                        id: "landlord",
                        storageId: "ref@landlord",
                        fieldId: "landlord",
                        type: "ref",
                        label: "Landlord",
                        validation: [],
                        listValidation: [],
                        settings: { models: [{ modelId: "author" }] }
                    },
                    {
                        id: "labels",
                        storageId: "text@labels",
                        fieldId: "labels",
                        type: "text",
                        label: "Labels",
                        list: true,
                        validation: [],
                        listValidation: []
                    }
                ]
            }
        },
        {
            id: "tags",
            storageId: "text@tags",
            fieldId: "tags",
            type: "text",
            label: "Tags",
            list: true,
            validation: [],
            listValidation: []
        },
        {
            id: "contacts",
            storageId: "object@contacts",
            fieldId: "contacts",
            type: "object",
            label: "Contacts",
            list: true,
            validation: [],
            listValidation: [],
            settings: {
                layout: [["email"]],
                fields: [
                    {
                        id: "email",
                        storageId: "text@email",
                        fieldId: "email",
                        type: "text",
                        label: "Email",
                        validation: [],
                        listValidation: []
                    }
                ]
            }
        },
        {
            id: "employer",
            storageId: "ref@employer",
            fieldId: "employer",
            type: "ref",
            label: "Employer",
            validation: [],
            listValidation: [],
            settings: { models: [{ modelId: "author" }] }
        }
    ]
};

export const createProfilePlugins = () => {
    return [createModelPlugin(profileModel as Parameters<typeof createModelPlugin>[0])];
};
