import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const model = createModel({
    fields: [
        createModelField({
            fieldId: "content",
            type: "dynamicZone",
            list: true,
            settings: {
                templates: [
                    {
                        id: "textTemplate",
                        name: "Text Template",
                        gqlTypeName: "TextTemplate",
                        icon: undefined,
                        description: "",
                        fields: [
                            createModelField({
                                fieldId: "title",
                                type: "text",
                                list: false
                            })
                        ],
                        layout: [],
                        validation: []
                    }
                ]
            }
        })
    ]
});

describe("dynamicZone storage converter - unknown template handling", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should not include undefined entries when a list item references an unknown template", () => {
        const { convertFromStorage } = converters;

        const storageValue = {
            "dynamicZone@contentId": [
                {
                    _templateId: "textTemplate",
                    "text@titleId": "Hello"
                },
                {
                    _templateId: "deletedTemplate",
                    "text@titleId": "This template no longer exists"
                },
                {
                    _templateId: "textTemplate",
                    "text@titleId": "World"
                }
            ]
        };

        const result = convertFromStorage({
            fields: model.fields,
            values: storageValue
        });

        const items = result.content;
        expect(Array.isArray(items)).toBe(true);
        // The unknown template entry should be filtered out, not left as undefined
        expect(items).not.toContainEqual(undefined);
        expect(items).toHaveLength(2);
        expect(items[0]).toEqual({ _templateId: "textTemplate", title: "Hello" });
        expect(items[1]).toEqual({ _templateId: "textTemplate", title: "World" });
    });

    it("should return undefined for a single-value field referencing an unknown template", () => {
        const singleModel = createModel({
            fields: [
                createModelField({
                    fieldId: "content",
                    type: "dynamicZone",
                    list: false,
                    settings: {
                        templates: [
                            {
                                id: "textTemplate",
                                name: "Text Template",
                                gqlTypeName: "TextTemplate",
                                icon: undefined,
                                description: "",
                                fields: [
                                    createModelField({
                                        fieldId: "title",
                                        type: "text",
                                        list: false
                                    })
                                ],
                                layout: [],
                                validation: []
                            }
                        ]
                    }
                })
            ]
        });

        const run = async () => {
            const singleConverters = await getConverters(singleModel);
            return singleConverters.convertFromStorage({
                fields: singleModel.fields,
                values: {
                    "dynamicZone@contentId": {
                        _templateId: "deletedTemplate",
                        "text@titleId": "Gone"
                    }
                }
            });
        };

        expect(run()).resolves.toEqual({ content: undefined });
    });
});
