import { describe, expect, it } from "vitest";
import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { toEditorFields } from "~/features/target/toEditorFields.js";

const field = (overrides: Partial<CmsModelField> & Pick<CmsModelField, "fieldId" | "type">) => {
    return {
        id: overrides.fieldId,
        storageId: `${overrides.type}@${overrides.fieldId}`,
        label: overrides.fieldId.toUpperCase(),
        validation: [],
        listValidation: [],
        ...overrides
    } as CmsModelField;
};

const createModel = (fields: CmsModelField[]): Pick<CmsModel, "fields"> => {
    return { fields };
};

describe("toEditorFields", () => {
    it("marks only top-level scalar fields of the five writable types as writable", () => {
        const model = createModel([
            field({ fieldId: "a", type: "text" }),
            field({ fieldId: "b", type: "long-text" }),
            field({ fieldId: "c", type: "number" }),
            field({ fieldId: "d", type: "boolean" }),
            field({ fieldId: "e", type: "datetime" })
        ]);

        const fields = toEditorFields(model, { a: "x", b: "y", c: 1, d: true, e: "2024-01-15" });

        expect(fields).toEqual([
            { path: "a", label: "A", type: "text", value: "x", writable: true },
            { path: "b", label: "B", type: "long-text", value: "y", writable: true },
            { path: "c", label: "C", type: "number", value: 1, writable: true },
            { path: "d", label: "D", type: "boolean", value: true, writable: true },
            { path: "e", label: "E", type: "datetime", value: "2024-01-15", writable: true }
        ]);
    });

    it("reads dynamic zones, references, files, rich text and other types as read-only", () => {
        const model = createModel([
            field({ fieldId: "zone", type: "dynamicZone" }),
            field({ fieldId: "ref", type: "ref" }),
            field({ fieldId: "file", type: "file" }),
            field({ fieldId: "body", type: "rich-text" }),
            field({ fieldId: "custom", type: "customPluginType" })
        ]);

        const fields = toEditorFields(model, {
            zone: { _templateId: "t1" },
            ref: { id: "r1", entryId: "r1", modelId: "author" },
            file: "https://files/a.png",
            body: [{ type: "p" }],
            custom: "x"
        });

        expect(fields.map(item => [item.path, item.type, item.writable])).toEqual([
            ["zone", "dynamicZone", false],
            ["ref", "ref", false],
            ["file", "file", false],
            ["body", "rich-text", false],
            ["custom", "customPluginType", false]
        ]);
        expect(fields[0].value).toEqual({ _templateId: "t1" });
    });

    it("gives a missing value as null", () => {
        const fields = toEditorFields(createModel([field({ fieldId: "a", type: "text" })]), {});

        expect(fields).toEqual([
            { path: "a", label: "A", type: "text", value: null, writable: true }
        ]);
    });

    it("flattens nested objects to dotted paths, recursively, with writable leaves", () => {
        const model = createModel([
            field({
                fieldId: "address",
                type: "object",
                settings: {
                    fields: [
                        field({ fieldId: "street", type: "text" }),
                        field({
                            fieldId: "location",
                            type: "object",
                            settings: {
                                fields: [
                                    field({ fieldId: "label", type: "text" }),
                                    field({ fieldId: "photo", type: "file" })
                                ]
                            }
                        })
                    ]
                }
            })
        ]);

        const fields = toEditorFields(model, {
            address: { street: "Main", location: { label: "Home", photo: "p.png" } }
        });

        expect(fields.map(item => [item.path, item.value, item.writable])).toEqual([
            ["address.street", "Main", true],
            ["address.location.label", "Home", true],
            ["address.location.photo", "p.png", false]
        ]);
    });

    it("reads the children of an object whose value is missing as null", () => {
        const model = createModel([
            field({
                fieldId: "address",
                type: "object",
                settings: { fields: [field({ fieldId: "street", type: "text" })] }
            })
        ]);

        expect(toEditorFields(model, { address: null })).toEqual([
            { path: "address.street", label: "STREET", type: "text", value: null, writable: true }
        ]);
        expect(toEditorFields(model, {})).toEqual([
            { path: "address.street", label: "STREET", type: "text", value: null, writable: true }
        ]);
    });

    it("reads a multiple-values field as one read-only row and never descends into a list object", () => {
        const model = createModel([
            field({ fieldId: "tags", type: "text", list: true }),
            field({
                fieldId: "contacts",
                type: "object",
                list: true,
                settings: { fields: [field({ fieldId: "email", type: "text" })] }
            })
        ]);

        const fields = toEditorFields(model, {
            tags: ["a"],
            contacts: [{ email: "a@b.c" }]
        });

        expect(fields).toEqual([
            { path: "tags", label: "TAGS", type: "text", value: ["a"], writable: false },
            {
                path: "contacts",
                label: "CONTACTS",
                type: "object",
                value: [{ email: "a@b.c" }],
                writable: false
            }
        ]);
    });

    it("reads an object without child definitions as one read-only row", () => {
        const model = createModel([field({ fieldId: "blob", type: "object" })]);

        expect(toEditorFields(model, { blob: { x: 1 } })).toEqual([
            { path: "blob", label: "BLOB", type: "object", value: { x: 1 }, writable: false }
        ]);
    });

    describe("datetime values", () => {
        const read = (
            settings: Record<string, unknown> | undefined,
            value: unknown,
            list = false
        ) => {
            const model = createModel([field({ fieldId: "d", type: "datetime", settings, list })]);
            return toEditorFields(model, { d: value as never })[0].value;
        };
        const date = new Date("2024-01-15T10:30:00.000Z");

        it("gives a date as YYYY-MM-DD", () => {
            expect(read({ type: "date" }, date)).toBe("2024-01-15");
        });

        it("gives dateTimeWithoutTimezone and an unset type as an ISO string", () => {
            expect(read({ type: "dateTimeWithoutTimezone" }, date)).toBe(
                "2024-01-15T10:30:00.000Z"
            );
            expect(read(undefined, date)).toBe("2024-01-15T10:30:00.000Z");
        });

        it("leaves time, dateTimeWithTimezone and strings unchanged", () => {
            expect(read({ type: "time" }, "10:30:00")).toBe("10:30:00");
            expect(read({ type: "dateTimeWithTimezone" }, "2024-01-15T10:30:00+02:00")).toBe(
                "2024-01-15T10:30:00+02:00"
            );
            expect(read({ type: "date" }, "2024-01-15")).toBe("2024-01-15");
        });

        it("gives an invalid Date and a missing value as null", () => {
            expect(read({ type: "date" }, new Date("nope"))).toBeNull();
            expect(read({ type: "date" }, null)).toBeNull();
            expect(read({ type: "date" }, undefined)).toBeNull();
        });

        it("normalises each item of a list", () => {
            expect(read({ type: "date" }, [date, "2024-02-01", new Date("nope")], true)).toEqual([
                "2024-01-15",
                "2024-02-01",
                null
            ]);
        });
    });
});
