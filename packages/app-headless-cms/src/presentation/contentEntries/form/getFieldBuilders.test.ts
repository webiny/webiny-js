import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsFormModelFeature } from "~/features/formModel/feature.js";

const model = {
    modelId: "test",
    fields: [
        {
            id: "textSingle",
            fieldId: "textSingle",
            type: "text",
            label: "Text",
            tags: [],
            list: false,
            renderer: { name: "text-input", settings: {} },
            validation: [],
            listValidation: [],
            settings: {},
            predefinedValues: { enabled: false, values: [] }
        },
        {
            id: "objectMultiple",
            fieldId: "objectMultiple",
            type: "object",
            label: "Object Multiple",
            tags: [],
            list: true,
            renderer: { name: "objects-accordion", settings: {} },
            validation: [],
            listValidation: [],
            predefinedValues: { enabled: false, values: [] },
            settings: {
                fields: [
                    {
                        id: "uuid",
                        fieldId: "uuid",
                        type: "text",
                        label: "UUID",
                        tags: ["uuid"],
                        list: false,
                        renderer: { name: "text-input", settings: null },
                        validation: [],
                        listValidation: [],
                        settings: {},
                        predefinedValues: { enabled: false, values: [] }
                    },
                    {
                        id: "name",
                        fieldId: "name",
                        type: "text",
                        label: "Name",
                        tags: [],
                        list: false,
                        renderer: { name: "text-input", settings: null },
                        validation: [],
                        listValidation: [],
                        settings: {},
                        predefinedValues: { enabled: false, values: [] }
                    }
                ],
                layout: [["uuid"], ["name"]]
            }
        },
        {
            id: "dynamicZoneList",
            fieldId: "dynamicZoneList",
            type: "dynamicZone",
            label: "DZ List",
            tags: [],
            list: true,
            renderer: { name: "dynamicZone", settings: {} },
            validation: [],
            listValidation: [],
            predefinedValues: { enabled: false, values: [] },
            settings: {
                templates: [
                    {
                        id: "textBlock",
                        name: "Text Block",
                        gqlTypeName: "TextBlock",
                        fields: [
                            {
                                id: "uuid",
                                fieldId: "uuid",
                                type: "text",
                                label: "UUID",
                                tags: ["uuid"],
                                list: false,
                                renderer: { name: "text-input", settings: null },
                                validation: [],
                                listValidation: [],
                                settings: {},
                                predefinedValues: { enabled: false, values: [] }
                            },
                            {
                                id: "title",
                                fieldId: "title",
                                type: "text",
                                label: "Title",
                                tags: [],
                                list: false,
                                renderer: { name: "text-input", settings: null },
                                validation: [],
                                listValidation: [],
                                settings: {},
                                predefinedValues: { enabled: false, values: [] }
                            }
                        ],
                        layout: [["uuid"], ["title"]],
                        validation: []
                    }
                ]
            }
        }
    ],
    layout: [["textSingle"], ["objectMultiple"], ["dynamicZoneList"]]
} as any;

function createCmsForm() {
    const container = new Container();
    FormModelFeature.register(container);
    CmsFormModelFeature.register(container);

    const builder = container.resolve(CmsFormModelBuilder);
    const config = builder.build(model);
    const factory = container.resolve(FormModelFactory);
    return factory.create(config);
}

describe("getFieldBuilders with CMS model", () => {
    it("traverse should visit all builders including nested", () => {
        const form = createCmsForm();
        const visited: Array<{ fieldType: string; tags: string[] }> = [];
        form.traverse(builder => {
            visited.push({ fieldType: builder.getType(), tags: builder.getTags() });
        });
        // top-level: textSingle, objectMultiple, dynamicZoneList = 3
        // objectMultiple children: _id, uuid, name = 3
        // dynamicZoneList template "textBlock" children: _id, uuid, title = 3
        // Total = 9
        expect(visited.length).toBe(9);
    });

    it("traverse should find builders tagged 'uuid'", () => {
        const form = createCmsForm();
        const uuidBuilders: any[] = [];
        form.traverse(builder => {
            if (builder.getTags().includes("uuid")) {
                uuidBuilders.push(builder);
            }
        });
        // objectMultiple.uuid + dynamicZoneList.textBlock.uuid = 2
        expect(uuidBuilders.length).toBe(2);
    });

    it("traverse should allow modifying builders with defaultValue and cloneValue", () => {
        const form = createCmsForm();
        let count = 0;
        form.traverse(builder => {
            if (builder.getTags().includes("uuid")) {
                builder.defaultValue(() => String(Date.now()));
                builder.cloneValue(() => String(Date.now()));
                count++;
            }
        });
        expect(count).toBe(2);
    });

    it("getName should return the field name for all builders", () => {
        const form = createCmsForm();
        const names: string[] = [];
        form.traverse(builder => {
            names.push(builder.getName());
        });
        expect(names).toContain("textSingle");
        expect(names).toContain("objectMultiple");
        expect(names).toContain("dynamicZoneList");
        expect(names).toContain("uuid");
        expect(names).toContain("name");
        expect(names).toContain("title");
    });

    it("getType should return the field type", () => {
        const form = createCmsForm();
        const types: Record<string, string> = {};
        form.traverse(builder => {
            types[builder.getName()] = builder.getType();
        });
        expect(types["textSingle"]).toBe("text");
        expect(types["objectMultiple"]).toBe("object");
        expect(types["uuid"]).toBe("text");
    });

    it("should find builders by name using traverse", () => {
        const form = createCmsForm();
        const matched: string[] = [];
        form.traverse(builder => {
            if (builder.getName() === "uuid") {
                matched.push(builder.getName());
            }
        });
        expect(matched.length).toBe(2);
    });

    it("should find builders by type using traverse", () => {
        const form = createCmsForm();
        const textBuilders: string[] = [];
        form.traverse(builder => {
            if (builder.getType() === "text") {
                textBuilders.push(builder.getName());
            }
        });
        // textSingle + objectMultiple._id + objectMultiple.uuid + objectMultiple.name + dz.textBlock._id + dz.textBlock.uuid + dz.textBlock.title = 7
        expect(textBuilders.length).toBe(7);
    });

    it("should combine getName, getType, and getTags for precise filtering", () => {
        const form = createCmsForm();
        const matched: string[] = [];
        form.traverse(builder => {
            if (
                builder.getType() === "text" &&
                builder.getName() === "uuid" &&
                builder.getTags().includes("uuid")
            ) {
                matched.push(builder.getName());
            }
        });
        expect(matched.length).toBe(2);
    });
});
