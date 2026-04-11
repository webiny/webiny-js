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

    describe("beforeChange / afterChange", () => {
        it("should run beforeChange pipeline in order, transforming value", () => {
            const form = new FormModel({
                fields: fields => ({
                    path: fields
                        .text()
                        .label("Path")
                        .beforeChange(value => String(value).trim())
                        .beforeChange(value => String(value).toLowerCase())
                })
            });

            form.field("path").setValue("  Hello World  ");
            expect(form.field("path").getValue()).toBe("hello world");
        });

        it("should run afterChange after value is stored", () => {
            const received: unknown[] = [];
            const form = new FormModel({
                fields: fields => ({
                    title: fields
                        .text()
                        .label("Title")
                        .afterChange(value => {
                            received.push(value);
                        })
                })
            });

            form.field("title").setValue("Hello");
            expect(received).toEqual(["Hello"]);
        });

        it("should pass transformed value to afterChange", () => {
            const received: unknown[] = [];
            const form = new FormModel({
                fields: fields => ({
                    path: fields
                        .text()
                        .label("Path")
                        .beforeChange(value => String(value).toLowerCase())
                        .afterChange(value => {
                            received.push(value);
                        })
                })
            });

            form.field("path").setValue("HELLO");
            expect(form.field("path").getValue()).toBe("hello");
            expect(received).toEqual(["hello"]);
        });

        it("should not fire afterChange when value does not change (recursion guard)", () => {
            const calls: string[] = [];
            const form = new FormModel({
                fields: fields => ({
                    title: fields
                        .text()
                        .label("Title")
                        .beforeChange(value => "constant")
                        .afterChange(() => {
                            calls.push("afterChange");
                        })
                })
            });

            form.field("title").setValue("anything");
            expect(calls).toEqual(["afterChange"]);
            expect(form.field("title").getValue()).toBe("constant");

            // Setting again — beforeChange still produces "constant", which === current value.
            // afterChange should NOT fire.
            form.field("title").setValue("something else");
            expect(calls).toEqual(["afterChange"]);
        });

        it("should not trigger beforeChange or afterChange on setData", () => {
            const calls: string[] = [];
            const form = new FormModel({
                fields: fields => ({
                    title: fields
                        .text()
                        .label("Title")
                        .beforeChange(value => {
                            calls.push("before");
                            return value;
                        })
                        .afterChange(() => {
                            calls.push("after");
                        })
                })
            });

            form.setData({ title: "Loaded" });
            expect(calls).toEqual([]);
            expect(form.field("title").getValue()).toBe("Loaded");
        });

        it("should support cross-field afterChange triggering target field pipeline", () => {
            const form = new FormModel({
                fields: fields => ({
                    title: fields
                        .text()
                        .label("Title")
                        .afterChange((value, f) => {
                            // Auto-generate path from title
                            const path = "/" + String(value).toLowerCase().replace(/\s+/g, "-");
                            f.field("path").setValue(path);
                        }),
                    path: fields
                        .text()
                        .label("Path")
                        .beforeChange(value => {
                            // Ensure path starts with /
                            const str = String(value);
                            return str.startsWith("/") ? str : "/" + str;
                        })
                })
            });

            form.field("title").setValue("Hello World");
            expect(form.field("path").getValue()).toBe("/hello-world");
        });

        it("should allow appending callbacks to existing fields at runtime", () => {
            const form = new FormModel({
                fields: fields => ({
                    title: fields.text().label("Title")
                })
            });

            const field = form.field("title");
            field.addBeforeChange(value => String(value).toUpperCase());
            field.setValue("hello");
            expect(field.getValue()).toBe("HELLO");
        });

        it("should chain builder callbacks with runtime-appended callbacks", () => {
            const form = new FormModel({
                fields: fields => ({
                    path: fields
                        .text()
                        .label("Path")
                        .beforeChange(value => String(value).trim())
                })
            });

            // Append another transform at runtime (simulating a modifier)
            form.field("path").addBeforeChange(value => String(value).toLowerCase());
            form.field("path").setValue("  HELLO  ");
            expect(form.field("path").getValue()).toBe("hello");
        });

        it("should demonstrate title→path with path-dirty tracking", () => {
            const form = new FormModel({
                fields: fields => ({
                    title: fields
                        .text()
                        .label("Title")
                        .required("Title is required")
                        .afterChange((value, f) => {
                            // Only auto-generate if path is empty
                            if (f.field("path").getValue()) {
                                return;
                            }
                            const slug = String(value)
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/^-|-$/g, "");
                            f.field("path").setValue("/" + slug);
                        }),
                    path: fields
                        .text()
                        .label("Path")
                        .required("Path is required")
                        .beforeChange(value => {
                            const str = String(value);
                            return (
                                "/" +
                                str
                                    .replace(/^\//, "")
                                    .toLowerCase()
                                    .replace(/[^a-z0-9/-]+/g, "-")
                                    .replace(/^-|-$/g, "")
                            );
                        })
                }),
                layout: layout => [layout.row("title"), layout.row("path")]
            });

            // Type title → path auto-fills (path was null/empty)
            form.field("title").setValue("Hello World");
            expect(form.field("path").getValue()).toBe("/hello-world");

            // Manually edit path → title changes no longer overwrite
            form.field("path").setValue("/custom-path");
            expect(form.field("path").getValue()).toBe("/custom-path");

            form.field("title").setValue("New Title");
            // Path still "/custom-path" because path is no longer empty
            expect(form.field("path").getValue()).toBe("/custom-path");
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

    describe("modifiers (Phase 3)", () => {
        describe("form.fields() — add / replace / remove", () => {
            it("should add a new field via form.fields()", () => {
                const form = createBasicForm();
                form.fields(fields => ({
                    language: fields
                        .select()
                        .label("Language")
                        .options([
                            { label: "English", value: "en" },
                            { label: "German", value: "de" }
                        ])
                }));

                expect(form.field("language")).toBeDefined();
                expect(form.field("language").type).toBe("select");
                expect(form.getData()).toHaveProperty("language");
            });

            it("should add a field that appears in getData but not layout until positioned", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title")
                    })
                });

                form.fields(fields => ({
                    description: fields.text().label("Description")
                }));

                // Field exists in data
                expect(form.getData()).toHaveProperty("description");

                // But not in layout until explicitly positioned
                const fieldNames = form.vm.layout.map(row => row.fields[0].name);
                expect(fieldNames).not.toContain("description");

                // Position it
                form.layout(layout => [layout.row("description").after("title")]);
                const updatedNames = form.vm.layout.map(row => row.fields[0].name);
                expect(updatedNames).toEqual(["title", "description"]);
            });

            it("should replace an existing field when key matches", () => {
                const form = createBasicForm();
                form.field("title").setValue("Old Value");

                form.fields(fields => ({
                    title: fields.text().label("Replaced Title").placeholder("New placeholder")
                }));

                // The field is replaced entirely — old value is gone
                expect(form.field("title").config.label).toBe("Replaced Title");
                expect(form.field("title").config.placeholder).toBe("New placeholder");
                expect(form.field("title").getValue()).toBeNull();
            });

            it("should remove a field via undefined", () => {
                const form = createBasicForm();
                form.fields(() => ({
                    path: undefined
                }));

                expect(() => form.field("path")).toThrow('Field "path" not found.');
                expect(form.getData()).not.toHaveProperty("path");
            });

            it("should remove a field via field.remove()", () => {
                const form = createBasicForm();
                form.field("path").remove();

                expect(() => form.field("path")).toThrow('Field "path" not found.');
                expect(form.getData()).not.toHaveProperty("path");
            });

            it("should remove field from layout when removed via field.remove()", () => {
                const form = createBasicForm();
                expect(form.vm.layout).toHaveLength(2);

                form.field("path").remove();

                expect(form.vm.layout).toHaveLength(1);
                expect(form.vm.layout[0].fields[0].name).toBe("title");
            });

            it("should handle add + remove in the same fields() call", () => {
                const form = createBasicForm();
                form.fields(fields => ({
                    path: undefined,
                    slug: fields.text().label("Slug")
                }));

                expect(() => form.field("path")).toThrow();
                expect(form.field("slug")).toBeDefined();
            });
        });

        describe("form.field().setDisabled()", () => {
            it("should disable a field via setDisabled(true)", () => {
                const form = createBasicForm();
                form.field("title").setDisabled(true);

                expect(form.field("title").vm.disabled).toBe(true);
            });

            it("should re-enable a field via setDisabled(false)", () => {
                const form = createBasicForm();
                form.field("title").setDisabled(true);
                form.field("title").setDisabled(false);

                expect(form.field("title").vm.disabled).toBe(false);
            });
        });

        describe("form.field().as() — type narrowing", () => {
            it("should return the field when type matches", () => {
                const form = new FormModel({
                    fields: fields => ({
                        lang: fields
                            .select()
                            .label("Language")
                            .options([{ label: "English", value: "en" }])
                    })
                });

                const selectField = form.field("lang").as("select");
                expect(selectField).toBe(form.field("lang"));
            });

            it("should throw when type does not match", () => {
                const form = createBasicForm();
                expect(() => form.field("title").as("select")).toThrow(
                    'Field "title" is type "text", not "select".'
                );
            });
        });

        describe("modifier appends callbacks to existing fields", () => {
            it("should append beforeChange to an existing field", () => {
                const form = new FormModel({
                    fields: fields => ({
                        path: fields
                            .text()
                            .label("Path")
                            .beforeChange(value => String(value).trim())
                    })
                });

                // Modifier appends another transform
                form.field("path").addBeforeChange(value => String(value).toLowerCase());

                form.field("path").setValue("  HELLO  ");
                expect(form.field("path").getValue()).toBe("hello");
            });

            it("should append afterChange to an existing field", () => {
                const received: unknown[] = [];
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        path: fields.text().label("Path")
                    })
                });

                // Modifier appends afterChange
                form.field("title").addAfterChange((value, f) => {
                    received.push(value);
                    f.field("path").setValue("/" + String(value).toLowerCase());
                });

                form.field("title").setValue("Hello");
                expect(received).toEqual(["Hello"]);
                expect(form.field("path").getValue()).toBe("/hello");
            });
        });

        describe("layout positional modifiers", () => {
            function createFormWithLayout() {
                return new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        path: fields.text().label("Path"),
                        description: fields.text().label("Description")
                    }),
                    layout: layout => [
                        layout.row("title"),
                        layout.row("path"),
                        layout.row("description")
                    ]
                });
            }

            it("should insert a row before a target", () => {
                const form = createFormWithLayout();
                form.fields(fields => ({
                    language: fields.select().label("Language").options([])
                }));

                form.layout(layout => [layout.row("language").before("path")]);

                const names = form.vm.layout.map(row => row.fields[0].name);
                expect(names).toEqual(["title", "language", "path", "description"]);
            });

            it("should insert a row after a target", () => {
                const form = createFormWithLayout();
                form.fields(fields => ({
                    language: fields.select().label("Language").options([])
                }));

                form.layout(layout => [layout.row("language").after("path")]);

                const names = form.vm.layout.map(row => row.fields[0].name);
                expect(names).toEqual(["title", "path", "language", "description"]);
            });

            it("should replace a target row", () => {
                const form = createFormWithLayout();
                form.fields(fields => ({
                    slug: fields.text().label("Slug")
                }));

                form.layout(layout => [layout.row("slug").replace("path")]);

                const names = form.vm.layout.map(row => row.fields[0].name);
                expect(names).toEqual(["title", "slug", "description"]);
            });

            it("should remove a field from layout", () => {
                const form = createFormWithLayout();

                form.layout(layout => {
                    layout.remove("path");
                    return [];
                });

                const names = form.vm.layout.map(row => row.fields[0].name);
                expect(names).toEqual(["title", "description"]);
            });

            it("should append when no position is specified", () => {
                const form = createFormWithLayout();
                form.fields(fields => ({
                    language: fields.select().label("Language").options([])
                }));

                form.layout(layout => [layout.row("language")]);

                const names = form.vm.layout.map(row => row.fields[0].name);
                expect(names).toEqual(["title", "path", "description", "language"]);
            });

            it("should append when target is not found", () => {
                const form = createFormWithLayout();
                form.fields(fields => ({
                    language: fields.select().label("Language").options([])
                }));

                form.layout(layout => [layout.row("language").after("nonexistent")]);

                const names = form.vm.layout.map(row => row.fields[0].name);
                expect(names).toEqual(["title", "path", "description", "language"]);
            });
        });

        describe("IFormModifier integration", () => {
            it("should support a full modifier workflow: add field + position in layout + append callbacks", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title").required("Title is required"),
                        path: fields
                            .text()
                            .label("Path")
                            .required("Path is required")
                            .beforeChange(value => {
                                const str = String(value);
                                return (
                                    "/" +
                                    str
                                        .replace(/^\//, "")
                                        .toLowerCase()
                                        .replace(/[^a-z0-9/-]+/g, "-")
                                        .replace(/^-|-$/g, "")
                                );
                            })
                    }),
                    layout: layout => [layout.row("title"), layout.row("path")]
                });

                // Simulate a language modifier
                const modifier = {
                    modify(form: import("./abstractions.js").IFormModel) {
                        // Add language field
                        form.fields(fields => ({
                            language: fields
                                .select()
                                .label("Language")
                                .options([
                                    { label: "English", value: "en" },
                                    { label: "German", value: "de" }
                                ])
                                .afterChange((value, f) => {
                                    const current = String(f.field("path").getValue() || "");
                                    const stripped = current.replace(/^\/[a-z]{2}\//, "/");
                                    if (value && value !== "en") {
                                        f.field("path").setValue("/" + value + stripped);
                                    } else {
                                        f.field("path").setValue(stripped);
                                    }
                                })
                        }));

                        // Position after path
                        form.layout(layout => [layout.row("language").after("path")]);
                    }
                };

                modifier.modify(form);

                // Verify layout order
                const names = form.vm.layout.map(row => row.fields[0].name);
                expect(names).toEqual(["title", "path", "language"]);

                // Verify language field works
                form.field("path").setValue("/demo");
                form.field("language").setValue("de");
                expect(form.field("path").getValue()).toBe("/de/demo");

                // Verify getData includes language
                const data = form.getData();
                expect(data.language).toBe("de");
            });
        });
    });
});
