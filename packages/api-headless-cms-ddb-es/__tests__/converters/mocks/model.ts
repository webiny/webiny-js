import { CmsModelPlugin } from "@webiny/api-headless-cms";

export const createModel = () => {
    return new CmsModelPlugin(
        {
            modelId: "converter",
            singularApiName: "Converter",
            pluralApiName: "Converters",
            group: {
                id: "testing",
                name: "Testing"
            },
            name: "Converter",
            description: "Converter description.",
            titleFieldId: "titleFieldIdWithSomeValue",
            fields: [
                {
                    id: "titleFieldIdWithSomeValue",
                    // storageId: "text@titleStorageId",
                    label: "Title",
                    fieldId: "title",
                    type: "text"
                },
                {
                    id: "ageFieldIdWithSomeValue",
                    // storageId: "number@ageStorageId",
                    label: "Age",
                    fieldId: "age",
                    type: "number"
                },
                {
                    id: "isMarriedFieldIdWithSomeValue",
                    // storageId: "boolean@isMarriedStorageId",
                    label: "Is Married",
                    fieldId: "isMarried",
                    type: "boolean"
                },
                {
                    id: "dateOfBirthFieldIdWithSomeValue",
                    // storageId: "date@dateOfBirthStorageId",
                    label: "Date of birth",
                    fieldId: "dateOfBirth",
                    type: "datetime"
                },
                {
                    id: "descriptionFieldIdWithSomeValue",
                    // storageId: "long-text@descriptionStorageId",
                    label: "Description",
                    fieldId: "description",
                    type: "long-text"
                },
                {
                    id: "bodyFieldIdWithSomeValue",
                    // storageId: "rich-text@bodyStorageId",
                    label: "Body",
                    fieldId: "body",
                    type: "rich-text"
                },
                {
                    id: "informationFieldIdWithSomeValue",
                    // storageId: "object@informationStorageId",
                    label: "Information",
                    fieldId: "information",
                    type: "object",
                    settings: {
                        fields: [
                            {
                                id: "subtitleFieldIdWithSomeValue",
                                // storageId: "text@subtitleStorageId",
                                label: "Subtitle",
                                fieldId: "subtitle",
                                type: "text"
                            },
                            {
                                id: "subAgeFieldIdWithSomeValue",
                                // storageId: "number@subAgeStorageId",
                                label: "SubAge",
                                fieldId: "subAge",
                                type: "number"
                            },
                            {
                                id: "subIsMarriedFieldIdWithSomeValue",
                                // storageId: "boolean@subIsMarriedStorageId",
                                label: "Sub Is Married",
                                fieldId: "subIsMarried",
                                type: "boolean"
                            },
                            {
                                id: "subDateOfBirthFieldIdWithSomeValue",
                                // storageId: "date@subDateOfBirthStorageId",
                                label: "Date of birth",
                                fieldId: "subDateOfBirth",
                                type: "datetime"
                            },
                            {
                                id: "subDescriptionFieldIdWithSomeValue",
                                // storageId: "long-text@subDescriptionStorageId",
                                label: "Sub Description",
                                fieldId: "subDescription",
                                type: "long-text"
                            },
                            {
                                id: "subBodyFieldIdWithSomeValue",
                                // storageId: "rich-text@subBodyStorageId",
                                label: "Sub Body",
                                fieldId: "subBody",
                                type: "rich-text"
                            },
                            {
                                id: "subInformationFieldIdWithSomeValue",
                                // storageId: "object@subInformationStorageId",
                                label: "Sub Information",
                                fieldId: "subInformation",
                                type: "object",
                                settings: {
                                    fields: [
                                        {
                                            id: "subSecondSubtitleFieldIdWithSomeValue",
                                            // storageId: "text@subSecondSubtitleStorageId",
                                            label: "Subtitle",
                                            fieldId: "subSecondSubtitle",
                                            type: "text"
                                        },
                                        {
                                            id: "subSecondSubAgeFieldIdWithSomeValue",
                                            // storageId: "number@subSecondSubAgeStorageId",
                                            label: "SubAge",
                                            fieldId: "subSecondSubAge",
                                            type: "number"
                                        },
                                        {
                                            id: "subSecondSubIsMarriedFieldIdWithSomeValue",
                                            // storageId: "boolean@subSecondSubIsMarriedStorageId",
                                            label: "Sub Is Married",
                                            fieldId: "subSecondSubIsMarried",
                                            type: "boolean"
                                        },
                                        {
                                            id: "subSecondSubDateOfBirthFieldIdWithSomeValue",
                                            // storageId: "date@subSecondSubDateOfBirthStorageId",
                                            label: "Date of birth",
                                            fieldId: "subSecondSubDateOfBirth",
                                            type: "datetime"
                                        },
                                        {
                                            id: "subSecondSubDescriptionFieldIdWithSomeValue",
                                            // storageId: "long-text@subSecondSubDescriptionStorageId",
                                            label: "Sub Description",
                                            fieldId: "subSecondSubDescription",
                                            type: "long-text"
                                        },
                                        {
                                            id: "subSecondSubBodyFieldIdWithSomeValue",
                                            // storageId: "rich-text@subSecondSubBodyStorageId",
                                            label: "Sub Body",
                                            fieldId: "subSecondSubBody",
                                            type: "rich-text"
                                        }
                                    ],
                                    layout: []
                                }
                            }
                        ],
                        layout: []
                    }
                }
            ],
            layout: []
        },
        {
            validateLayout: false
        }
    );
};
