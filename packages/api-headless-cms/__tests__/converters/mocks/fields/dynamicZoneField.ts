import { createModelField } from "~tests/converters/mocks/utils";

export const createDynamicZoneField = () => {
    return createModelField({
        type: "dynamicZone",
        fieldId: "dynamicZoneObject",
        multipleValues: false,
        settings: {
            templates: [
                {
                    layout: [["dzText", "dzObject", "dzObjectArray"]],
                    name: "DZ Text",
                    gqlTypeName: "DzTextObject",
                    icon: "fas/flag",
                    description: "",
                    id: "dzTemplateObject1",
                    fields: [
                        createModelField({
                            fieldId: "dzText",
                            type: "text"
                        }),
                        createModelField({
                            type: "object",
                            multipleValues: true,
                            fieldId: "dzObjectArray",
                            settings: {
                                fields: [
                                    createModelField({
                                        type: "text",
                                        multipleValues: false,
                                        fieldId: "titleInDzObjectArray"
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            type: "object",
                            multipleValues: false,
                            fieldId: "dzObject",
                            settings: {
                                fields: [
                                    createModelField({
                                        type: "text",
                                        multipleValues: false,
                                        fieldId: "titleInDzObject"
                                    })
                                ]
                            }
                        })
                    ]
                }
            ]
        }
    });
};

export const createDynamicZoneFieldMultiple = () => {
    return createModelField({
        type: "dynamicZone",
        fieldId: "dynamicZoneArray",
        multipleValues: true,
        settings: {
            templates: [
                {
                    layout: [["dzText", "dzObject", "dzObjectArray"]],
                    name: "DZ Text",
                    gqlTypeName: "DzTextObjectArray",
                    icon: "fas/flag",
                    description: "",
                    id: "dzTemplateArray1",
                    fields: [
                        createModelField({
                            fieldId: "dzText",
                            type: "text"
                        }),
                        createModelField({
                            type: "object",
                            multipleValues: true,
                            fieldId: "dzObjectArray",
                            settings: {
                                fields: [
                                    createModelField({
                                        type: "text",
                                        multipleValues: false,
                                        fieldId: "titleInDzObjectArray"
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            type: "object",
                            multipleValues: false,
                            fieldId: "dzObject",
                            settings: {
                                fields: [
                                    createModelField({
                                        type: "text",
                                        multipleValues: false,
                                        fieldId: "titleInDzObject"
                                    })
                                ]
                            }
                        })
                    ]
                }
            ]
        }
    });
};
