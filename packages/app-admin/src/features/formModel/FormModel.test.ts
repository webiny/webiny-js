import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { FormModel } from "./FormModel.js";

function createBasicForm() {
    return new FormModel({
        fields: fields => ({
            title: fields.text().label("Title").required("Title is required"),
            path: fields.text().label("Path").required("Path is required")
        })
    });
}

describe("FormModel", () => {
    describe("field creation", () => {
        it("should create fields from builder definitions", () => {
            const form = createBasicForm();
            expect(form.field("title")).toBeDefined();
            expect(form.field("path")).toBeDefined();
        });

        it("should throw on unknown field access", () => {
            const form = createBasicForm();
            expect(() => form.field("unknown")).toThrow('Field "unknown" not found.');
        });
    });

    describe("setValue / getValue", () => {
        it("should set and get field values", () => {
            const form = createBasicForm();
            form.field("title").setValue("Hello");
            expect(form.field("title").getValue()).toBe("Hello");
        });

        it("should default to null when no defaultValue is set", () => {
            const form = createBasicForm();
            expect(form.field("title").getValue()).toBeNull();
        });

        it("should use defaultValue when provided", () => {
            const form = new FormModel({
                fields: fields => ({
                    status: fields.text().defaultValue("draft")
                })
            });
            expect(form.field("status").getValue()).toBe("draft");
        });
    });

    describe("getData / setData", () => {
        it("should return all field values including hidden", () => {
            const form = new FormModel({
                fields: fields => ({
                    title: fields.text().label("Title"),
                    pageType: fields.text().hidden().defaultValue("static")
                })
            });

            form.field("title").setValue("Hello");
            const data = form.getData();

            expect(data).toEqual({
                title: "Hello",
                pageType: "static"
            });
        });

        it("should hydrate fields from data object", () => {
            const form = createBasicForm();
            form.setData({ title: "My Page", path: "/my-page" });

            expect(form.field("title").getValue()).toBe("My Page");
            expect(form.field("path").getValue()).toBe("/my-page");
        });

        it("should ignore unknown fields in setData", () => {
            const form = createBasicForm();
            form.setData({ title: "Test", unknown: "value" });
            expect(form.field("title").getValue()).toBe("Test");
            expect(() => form.field("unknown")).toThrow();
        });
    });

    describe("isDirty", () => {
        it("should not be dirty initially", () => {
            const form = createBasicForm();
            expect(form.isDirty).toBe(false);
        });

        it("should be dirty after setValue", () => {
            const form = createBasicForm();
            form.field("title").setValue("Changed");
            expect(form.isDirty).toBe(true);
        });

        it("should not be dirty after setData", () => {
            const form = createBasicForm();
            form.setData({ title: "Loaded", path: "/loaded" });
            expect(form.isDirty).toBe(false);
        });

        it("should not be dirty after reverting to baseline value", () => {
            const form = createBasicForm();
            form.setData({ title: "Original", path: "/original" });
            form.field("title").setValue("Changed");
            expect(form.isDirty).toBe(true);
            form.field("title").setValue("Original");
            expect(form.isDirty).toBe(false);
        });
    });

    describe("reset", () => {
        it("should revert values to setData baseline", () => {
            const form = createBasicForm();
            form.setData({ title: "Original", path: "/original" });
            form.field("title").setValue("Changed");
            form.reset();

            expect(form.field("title").getValue()).toBe("Original");
            expect(form.isDirty).toBe(false);
        });

        it("should clear validation state on reset", async () => {
            const form = createBasicForm();
            await form.validate();
            expect(form.errors.length).toBeGreaterThan(0);

            form.reset();
            expect(form.errors).toEqual([]);
            expect(form.isValid).toBeNull();
        });
    });

    describe("validation", () => {
        it("should fail validation for empty required fields", async () => {
            const form = createBasicForm();
            const valid = await form.validate();

            expect(valid).toBe(false);
            expect(form.isValid).toBe(false);
            expect(form.errors).toHaveLength(2);
            expect(form.errors[0].path).toBe("title");
            expect(form.errors[0].message).toBe("Title is required");
            expect(form.errors[1].path).toBe("path");
        });

        it("should pass validation when required fields have values", async () => {
            const form = createBasicForm();
            form.field("title").setValue("My Page");
            form.field("path").setValue("/my-page");

            const valid = await form.validate();

            expect(valid).toBe(true);
            expect(form.isValid).toBe(true);
            expect(form.errors).toHaveLength(0);
        });

        it("should validate zod schemas", async () => {
            const form = new FormModel({
                fields: fields => ({
                    email: fields.text().label("Email").schema(z.string().email("Invalid email"))
                })
            });

            form.field("email").setValue("not-an-email");
            const valid = await form.validate();

            expect(valid).toBe(false);
            expect(form.errors[0].message).toBe("Invalid email");
        });

        it("should run required check before zod schema", async () => {
            const form = new FormModel({
                fields: fields => ({
                    email: fields
                        .text()
                        .label("Email")
                        .required("Email is required")
                        .schema(z.string().email("Invalid email"))
                })
            });

            const valid = await form.validate();

            expect(valid).toBe(false);
            expect(form.errors[0].message).toBe("Email is required");
        });

        it("should expose field-level validation in field.vm", async () => {
            const form = createBasicForm();
            await form.validate();

            const titleVm = form.field("title").vm;
            expect(titleVm.validation.isValid).toBe(false);
            expect(titleVm.validation.message).toBe("Title is required");
        });

        it("isValid should be null before first validation", () => {
            const form = createBasicForm();
            expect(form.isValid).toBeNull();
        });
    });

    describe("submit", () => {
        it("should return data when valid", async () => {
            const form = createBasicForm();
            form.field("title").setValue("My Page");
            form.field("path").setValue("/my-page");

            const result = await form.submit();

            expect(result).toEqual({
                title: "My Page",
                path: "/my-page"
            });
        });

        it("should return false when invalid", async () => {
            const form = createBasicForm();
            const result = await form.submit();
            expect(result).toBe(false);
        });
    });

    describe("vm", () => {
        it("should expose layout with field VMs", () => {
            const form = createBasicForm();
            const vm = form.vm;

            expect(vm.layout).toHaveLength(2);
            expect(vm.layout[0].type).toBe("row");
            expect(vm.layout[0].fields[0].name).toBe("title");
            expect(vm.layout[1].fields[0].name).toBe("path");
        });

        it("should exclude hidden fields from layout", () => {
            const form = new FormModel({
                fields: fields => ({
                    title: fields.text().label("Title"),
                    pageType: fields.text().hidden().defaultValue("static")
                })
            });

            const vm = form.vm;
            expect(vm.layout).toHaveLength(1);
            expect(vm.layout[0].fields[0].name).toBe("title");
        });

        it("should expose isDirty and isValid", () => {
            const form = createBasicForm();
            expect(form.vm.isDirty).toBe(false);
            expect(form.vm.isValid).toBeNull();
        });

        it("should expose field onChange that calls setValue", () => {
            const form = createBasicForm();
            const fieldVM = form.vm.layout[0].fields[0];
            fieldVM.onChange("New Value");
            expect(form.field("title").getValue()).toBe("New Value");
        });
    });

    describe("layout", () => {
        it("should generate default layout (one row per non-hidden field)", () => {
            const form = createBasicForm();
            expect(form.vm.layout).toHaveLength(2);
        });

        it("should use explicit layout when provided", () => {
            const form = new FormModel({
                fields: fields => ({
                    title: fields.text().label("Title"),
                    path: fields.text().label("Path")
                }),
                layout: layout => [layout.row("title", "path")]
            });

            expect(form.vm.layout).toHaveLength(1);
            expect(form.vm.layout[0].fields).toHaveLength(2);
        });

        it("should warn about orphan fields in explicit layout", () => {
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            new FormModel({
                fields: fields => ({
                    title: fields.text().label("Title"),
                    path: fields.text().label("Path")
                }),
                layout: layout => [layout.row("title")]
            });

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Field "path" is not in the layout')
            );

            warnSpy.mockRestore();
        });

        it("should not warn about hidden orphan fields", () => {
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            new FormModel({
                fields: fields => ({
                    title: fields.text().label("Title"),
                    pageType: fields.text().hidden().defaultValue("static")
                }),
                layout: layout => [layout.row("title")]
            });

            expect(warnSpy).not.toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });

    describe("select field with options", () => {
        it("should resolve static options in field VM", () => {
            const form = new FormModel({
                fields: fields => ({
                    lang: fields
                        .select()
                        .label("Language")
                        .options([
                            { label: "English", value: "en" },
                            { label: "German", value: "de" }
                        ])
                })
            });

            const fieldVM = form.vm.layout[0].fields[0];
            expect(fieldVM.options).toEqual([
                { label: "English", value: "en" },
                { label: "German", value: "de" }
            ]);
        });

        it("should resolve reactive options function in field VM", () => {
            const form = new FormModel({
                fields: fields => ({
                    lang: fields
                        .select()
                        .label("Language")
                        .options(f => {
                            // Dynamic options based on form state
                            return [{ label: "Dynamic", value: "dynamic" }];
                        })
                })
            });

            const fieldVM = form.vm.layout[0].fields[0];
            expect(fieldVM.options).toEqual([{ label: "Dynamic", value: "dynamic" }]);
        });
    });
});
