import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { FormModel } from "./FormModel.js";
import type {
    IFormModel,
    IRowNodeVM,
    ITabsNodeVM,
    IElementNodeVM,
    IObjectFieldVM,
    ILayoutNodeAccessHandle,
    LayoutNodeVM
} from "./abstractions.js";

function asRow(node: LayoutNodeVM): IRowNodeVM {
    if (node.type !== "row") {
        throw new Error(`Expected row node, got "${node.type}"`);
    }
    return node;
}

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
            expect(asRow(vm.layout[0]).fields[0].name).toBe("title");
            expect(asRow(vm.layout[1]).fields[0].name).toBe("path");
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
            expect(asRow(vm.layout[0]).fields[0].name).toBe("title");
        });

        it("should expose isDirty and isValid", () => {
            const form = createBasicForm();
            expect(form.vm.isDirty).toBe(false);
            expect(form.vm.isValid).toBeNull();
        });

        it("should expose field onChange that calls setValue", () => {
            const form = createBasicForm();
            const fieldVM = asRow(form.vm.layout[0]).fields[0];
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
            expect(asRow(form.vm.layout[0]).fields).toHaveLength(2);
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
                        .beforeChange(() => "constant")
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

            const fieldVM = asRow(form.vm.layout[0]).fields[0];
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
                        .options(() => {
                            // Dynamic options based on form state
                            return [{ label: "Dynamic", value: "dynamic" }];
                        })
                })
            });

            const fieldVM = asRow(form.vm.layout[0]).fields[0];
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
                const fieldNames = form.vm.layout.map(row => asRow(row).fields[0].name);
                expect(fieldNames).not.toContain("description");

                // Position it
                form.layout(layout => [layout.row("description").after("title")]);
                const updatedNames = form.vm.layout.map(row => asRow(row).fields[0].name);
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
                expect(asRow(form.vm.layout[0]).fields[0].name).toBe("title");
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

                const names = form.vm.layout.map(row => asRow(row).fields[0].name);
                expect(names).toEqual(["title", "language", "path", "description"]);
            });

            it("should insert a row after a target", () => {
                const form = createFormWithLayout();
                form.fields(fields => ({
                    language: fields.select().label("Language").options([])
                }));

                form.layout(layout => [layout.row("language").after("path")]);

                const names = form.vm.layout.map(row => asRow(row).fields[0].name);
                expect(names).toEqual(["title", "path", "language", "description"]);
            });

            it("should replace a target row", () => {
                const form = createFormWithLayout();
                form.fields(fields => ({
                    slug: fields.text().label("Slug")
                }));

                form.layout(layout => [layout.row("slug").replace("path")]);

                const names = form.vm.layout.map(row => asRow(row).fields[0].name);
                expect(names).toEqual(["title", "slug", "description"]);
            });

            it("should remove a field from layout", () => {
                const form = createFormWithLayout();

                form.layout(layout => {
                    layout.remove("path");
                    return [];
                });

                const names = form.vm.layout.map(row => asRow(row).fields[0].name);
                expect(names).toEqual(["title", "description"]);
            });

            it("should append when no position is specified", () => {
                const form = createFormWithLayout();
                form.fields(fields => ({
                    language: fields.select().label("Language").options([])
                }));

                form.layout(layout => [layout.row("language")]);

                const names = form.vm.layout.map(row => asRow(row).fields[0].name);
                expect(names).toEqual(["title", "path", "description", "language"]);
            });

            it("should append when target is not found", () => {
                const form = createFormWithLayout();
                form.fields(fields => ({
                    language: fields.select().label("Language").options([])
                }));

                form.layout(layout => [layout.row("language").after("nonexistent")]);

                const names = form.vm.layout.map(row => asRow(row).fields[0].name);
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
                    modify(form: IFormModel) {
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
                const names = form.vm.layout.map(row => asRow(row).fields[0].name);
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

    describe("layout system expansion (Phase 5)", () => {
        describe("separator", () => {
            it("should include separator nodes in the resolved layout", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        description: fields.text().label("Description")
                    }),
                    layout: layout => [
                        layout.row("title"),
                        layout.separator(),
                        layout.row("description")
                    ]
                });

                const vm = form.vm;
                expect(vm.layout).toHaveLength(3);
                expect(vm.layout[0].type).toBe("row");
                expect(vm.layout[1].type).toBe("separator");
                expect(vm.layout[2].type).toBe("row");
            });

            it("should support separator via modifier layout API", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        description: fields.text().label("Description")
                    }),
                    layout: layout => [layout.row("title"), layout.row("description")]
                });

                form.layout(layout => [layout.separator().after("title")]);

                expect(form.vm.layout).toHaveLength(3);
                expect(form.vm.layout[1].type).toBe("separator");
            });
        });

        describe("tabs", () => {
            function createFormWithTabs() {
                return new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        slug: fields.text().label("Slug"),
                        description: fields.text().label("Description"),
                        metaTitle: fields.text().label("Meta Title"),
                        metaDescription: fields.text().label("Meta Description")
                    }),
                    layout: layout => [
                        layout.row("title", "slug"),
                        layout.tabs({
                            id: "settings",
                            tabs: [
                                {
                                    id: "general",
                                    label: "General",
                                    layout: [layout.row("description")]
                                },
                                {
                                    id: "seo",
                                    label: "SEO",
                                    description: "Optimize how this page appears in search",
                                    layout: [layout.row("metaTitle"), layout.row("metaDescription")]
                                }
                            ]
                        })
                    ]
                });
            }

            it("should resolve tabs layout node with tab definitions", () => {
                const form = createFormWithTabs();
                const vm = form.vm;

                expect(vm.layout).toHaveLength(2);
                expect(vm.layout[0].type).toBe("row");
                expect(vm.layout[1].type).toBe("tabs");

                const tabsNode = vm.layout[1] as ITabsNodeVM;
                expect(tabsNode.id).toBe("settings");
                expect(tabsNode.tabs).toHaveLength(2);
                expect(tabsNode.tabs[0].id).toBe("general");
                expect(tabsNode.tabs[0].label).toBe("General");
                expect(tabsNode.tabs[1].id).toBe("seo");
                expect(tabsNode.tabs[1].label).toBe("SEO");
                expect(tabsNode.tabs[1].description).toBe(
                    "Optimize how this page appears in search"
                );
            });

            it("should resolve fields inside tab layouts", () => {
                const form = createFormWithTabs();
                const tabsNode = form.vm.layout[1] as ITabsNodeVM;

                const generalTab = tabsNode.tabs[0];
                expect(generalTab.layout).toHaveLength(1);
                expect(generalTab.layout[0].type).toBe("row");
                const generalRow = generalTab.layout[0] as IRowNodeVM;
                expect(generalRow.fields[0].name).toBe("description");

                const seoTab = tabsNode.tabs[1];
                expect(seoTab.layout).toHaveLength(2);
            });

            it("should default activeTabId to the first tab", () => {
                const form = createFormWithTabs();
                const tabsNode = form.vm.layout[1] as ITabsNodeVM;
                expect(tabsNode.activeTabId).toBe("general");
            });

            it("should switch active tab via setActiveTab", () => {
                const form = createFormWithTabs();
                let tabsNode = form.vm.layout[1] as ITabsNodeVM;

                tabsNode.setActiveTab("seo");

                tabsNode = form.vm.layout[1] as ITabsNodeVM;
                expect(tabsNode.activeTabId).toBe("seo");
            });

            it("should fall back to first tab when active tab ID is invalid", () => {
                const form = createFormWithTabs();
                let tabsNode = form.vm.layout[1] as ITabsNodeVM;

                tabsNode.setActiveTab("nonexistent");

                tabsNode = form.vm.layout[1] as ITabsNodeVM;
                expect(tabsNode.activeTabId).toBe("general");
            });

            it("should compute hasErrors for tabs based on referenced fields", async () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title").required("Title is required"),
                        metaTitle: fields.text().label("Meta Title").required("Required")
                    }),
                    layout: layout => [
                        layout.tabs({
                            id: "settings",
                            tabs: [
                                {
                                    id: "general",
                                    label: "General",
                                    layout: [layout.row("title")]
                                },
                                {
                                    id: "seo",
                                    label: "SEO",
                                    layout: [layout.row("metaTitle")]
                                }
                            ]
                        })
                    ]
                });

                // Before validation, no errors
                let tabsNode = form.vm.layout[0] as ITabsNodeVM;
                expect(tabsNode.tabs[0].hasErrors).toBe(false);
                expect(tabsNode.tabs[1].hasErrors).toBe(false);

                // Fill only title, leave metaTitle empty
                form.field("title").setValue("Hello");
                await form.validate();

                tabsNode = form.vm.layout[0] as ITabsNodeVM;
                expect(tabsNode.tabs[0].hasErrors).toBe(false);
                expect(tabsNode.tabs[1].hasErrors).toBe(true);
            });

            it("should not warn about fields inside tabs as orphans", () => {
                const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

                new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        description: fields.text().label("Description")
                    }),
                    layout: layout => [
                        layout.row("title"),
                        layout.tabs({
                            id: "settings",
                            tabs: [
                                {
                                    id: "general",
                                    label: "General",
                                    layout: [layout.row("description")]
                                }
                            ]
                        })
                    ]
                });

                expect(warnSpy).not.toHaveBeenCalled();
                warnSpy.mockRestore();
            });

            it("should return null for tabs with empty tabs array", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title")
                    }),
                    layout: layout => [layout.row("title"), layout.tabs({ id: "empty", tabs: [] })]
                });

                expect(form.vm.layout).toHaveLength(1);
                expect(form.vm.layout[0].type).toBe("row");
            });
        });

        describe("element", () => {
            it("should include element nodes in the resolved layout", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title")
                    }),
                    layout: layout => [
                        layout.row("title"),
                        layout.element("usage-stats", { plan: "enterprise" })
                    ]
                });

                const vm = form.vm;
                expect(vm.layout).toHaveLength(2);
                expect(vm.layout[1].type).toBe("element");

                const elementNode = vm.layout[1] as IElementNodeVM;
                expect(elementNode.renderer).toBe("usage-stats");
                expect(elementNode.props).toEqual({ plan: "enterprise" });
            });

            it("should support element without props", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title")
                    }),
                    layout: layout => [layout.row("title"), layout.element("divider")]
                });

                const elementNode = form.vm.layout[1] as IElementNodeVM;
                expect(elementNode.renderer).toBe("divider");
                expect(elementNode.props).toBeUndefined();
            });
        });

        describe("named layout node access — form.layout(nodeId)", () => {
            function createFormWithTabs() {
                return new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        description: fields.text().label("Description"),
                        metaTitle: fields.text().label("Meta Title")
                    }),
                    layout: layout => [
                        layout.row("title"),
                        layout.tabs({
                            id: "settings",
                            tabs: [
                                {
                                    id: "general",
                                    label: "General",
                                    layout: [layout.row("description")]
                                },
                                {
                                    id: "seo",
                                    label: "SEO",
                                    layout: [layout.row("metaTitle")]
                                }
                            ]
                        })
                    ]
                });
            }

            it("should access a tabs node by ID and add a new tab", () => {
                const form = createFormWithTabs();

                form.fields(fields => ({
                    trackingId: fields.text().label("Tracking ID")
                }));

                (form.layout("settings") as ILayoutNodeAccessHandle)
                    .as("tabs")
                    .tab({
                        id: "analytics",
                        label: "Analytics",
                        layout: [{ type: "row", fieldIds: ["trackingId"] }]
                    })
                    .after("seo");

                const tabsNode = form.vm.layout[1] as ITabsNodeVM;
                expect(tabsNode.tabs).toHaveLength(3);
                expect(tabsNode.tabs[2].id).toBe("analytics");
                expect(tabsNode.tabs[2].label).toBe("Analytics");
            });

            it("should add a tab before an existing tab", () => {
                const form = createFormWithTabs();

                form.fields(fields => ({
                    trackingId: fields.text().label("Tracking ID")
                }));

                (form.layout("settings") as ILayoutNodeAccessHandle)
                    .as("tabs")
                    .tab({
                        id: "analytics",
                        label: "Analytics",
                        layout: [{ type: "row", fieldIds: ["trackingId"] }]
                    })
                    .before("seo");

                const tabsNode = form.vm.layout[1] as ITabsNodeVM;
                expect(tabsNode.tabs).toHaveLength(3);
                expect(tabsNode.tabs[0].id).toBe("general");
                expect(tabsNode.tabs[1].id).toBe("analytics");
                expect(tabsNode.tabs[2].id).toBe("seo");
            });

            it("should append to an existing tab's layout", () => {
                const form = createFormWithTabs();

                form.fields(fields => ({
                    ogImage: fields.text().label("OG Image")
                }));

                (form.layout("settings") as ILayoutNodeAccessHandle)
                    .as("tabs")
                    .tab("seo")
                    .layout(layout => [layout.row("ogImage")]);

                const tabsNode = form.vm.layout[1] as ITabsNodeVM;
                const seoTab = tabsNode.tabs.find(t => t.id === "seo")!;
                expect(seoTab.layout).toHaveLength(2);

                const lastRow = seoTab.layout[1] as IRowNodeVM;
                expect(lastRow.fields[0].name).toBe("ogImage");
            });

            it("should throw when accessing a non-existent node ID", () => {
                const form = createFormWithTabs();
                expect(() =>
                    (form.layout("nonexistent") as ILayoutNodeAccessHandle).as("tabs")
                ).toThrow('Layout node "nonexistent" not found.');
            });

            it("should throw when accessing a non-existent tab ID", () => {
                const form = createFormWithTabs();
                expect(() =>
                    (form.layout("settings") as ILayoutNodeAccessHandle)
                        .as("tabs")
                        .tab("nonexistent")
                ).toThrow('Tab "nonexistent" not found in tabs node "settings".');
            });
        });

        describe("positional modifiers targeting tabs/element nodes", () => {
            it("should insert a row before a tabs node by ID", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        subtitle: fields.text().label("Subtitle"),
                        description: fields.text().label("Description")
                    }),
                    layout: layout => [
                        layout.row("title"),
                        layout.tabs({
                            id: "settings",
                            tabs: [
                                {
                                    id: "general",
                                    label: "General",
                                    layout: [layout.row("description")]
                                }
                            ]
                        })
                    ]
                });

                form.layout(layout => [layout.row("subtitle").before("settings")]);

                expect(form.vm.layout).toHaveLength(3);
                expect(form.vm.layout[0].type).toBe("row");
                expect(form.vm.layout[1].type).toBe("row");
                expect(form.vm.layout[2].type).toBe("tabs");

                const row = form.vm.layout[1] as IRowNodeVM;
                expect(row.fields[0].name).toBe("subtitle");
            });

            it("should remove a tabs node by ID", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        description: fields.text().label("Description")
                    }),
                    layout: layout => [
                        layout.row("title"),
                        layout.tabs({
                            id: "settings",
                            tabs: [
                                {
                                    id: "general",
                                    label: "General",
                                    layout: [layout.row("description")]
                                }
                            ]
                        })
                    ]
                });

                form.layout(layout => {
                    layout.remove("settings");
                    return [];
                });

                expect(form.vm.layout).toHaveLength(1);
                expect(form.vm.layout[0].type).toBe("row");
            });

            it("should replace a tabs node by ID", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        description: fields.text().label("Description"),
                        metaTitle: fields.text().label("Meta Title")
                    }),
                    layout: layout => [
                        layout.row("title"),
                        layout.tabs({
                            id: "settings",
                            tabs: [
                                {
                                    id: "general",
                                    label: "General",
                                    layout: [layout.row("description")]
                                }
                            ]
                        })
                    ]
                });

                form.layout(layout => [layout.row("metaTitle").replace("settings")]);

                expect(form.vm.layout).toHaveLength(2);
                expect(form.vm.layout[0].type).toBe("row");
                expect(form.vm.layout[1].type).toBe("row");
                const row = form.vm.layout[1] as IRowNodeVM;
                expect(row.fields[0].name).toBe("metaTitle");
            });
        });

        describe("modifier integration with tabs", () => {
            it("should support a full modifier workflow: base form with tabs + modifier adds tab + modifier appends to existing tab", () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        description: fields.text().label("Description"),
                        metaTitle: fields.text().label("Meta Title")
                    }),
                    layout: layout => [
                        layout.row("title"),
                        layout.separator(),
                        layout.tabs({
                            id: "settings",
                            tabs: [
                                {
                                    id: "general",
                                    label: "General",
                                    layout: [layout.row("description")]
                                },
                                {
                                    id: "seo",
                                    label: "SEO",
                                    layout: [layout.row("metaTitle")]
                                }
                            ]
                        })
                    ]
                });

                // Modifier A: add analytics tab
                form.fields(fields => ({
                    trackingId: fields.text().label("Tracking ID")
                }));

                (form.layout("settings") as ILayoutNodeAccessHandle)
                    .as("tabs")
                    .tab({
                        id: "analytics",
                        label: "Analytics",
                        layout: [{ type: "row", fieldIds: ["trackingId"] }]
                    })
                    .after("seo");

                // Modifier B: append OG Image to SEO tab
                form.fields(fields => ({
                    ogImage: fields.text().label("OG Image")
                }));

                (form.layout("settings") as ILayoutNodeAccessHandle)
                    .as("tabs")
                    .tab("seo")
                    .layout(layout => [layout.row("ogImage")]);

                // Verify full layout
                const vm = form.vm;
                expect(vm.layout).toHaveLength(3); // row, separator, tabs
                expect(vm.layout[0].type).toBe("row");
                expect(vm.layout[1].type).toBe("separator");
                expect(vm.layout[2].type).toBe("tabs");

                const tabsNode = vm.layout[2] as ITabsNodeVM;
                expect(tabsNode.tabs).toHaveLength(3);
                expect(tabsNode.tabs[0].id).toBe("general");
                expect(tabsNode.tabs[1].id).toBe("seo");
                expect(tabsNode.tabs[2].id).toBe("analytics");

                // SEO tab now has metaTitle + ogImage
                const seoTab = tabsNode.tabs[1];
                expect(seoTab.layout).toHaveLength(2);

                // Verify all fields are in getData
                const data = form.getData();
                expect(data).toHaveProperty("trackingId");
                expect(data).toHaveProperty("ogImage");
            });
        });
    });

    describe("object fields (Phase 6)", () => {
        describe("non-list object field", () => {
            function createFormWithObject() {
                return new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        address: fields
                            .object()
                            .label("Address")
                            .fields(f => ({
                                street: f.text().label("Street").required("Street is required"),
                                city: f.text().label("City").required("City is required")
                            }))
                    }),
                    layout: layout => [layout.row("title"), layout.row("address")]
                });
            }

            it("should create an object field with children", () => {
                const form = createFormWithObject();
                const field = form.field("address");
                expect(field).toBeDefined();
                expect(field.type).toBe("object");
            });

            it("should access child fields via dot-notation", () => {
                const form = createFormWithObject();
                const street = form.field("address.street");
                expect(street).toBeDefined();
                expect(street.type).toBe("text");
            });

            it("should throw on invalid dot-notation", () => {
                const form = createFormWithObject();
                expect(() => form.field("address.zipcode")).toThrow(
                    'Field "address.zipcode" not found.'
                );
            });

            it("should return nested object from getData", () => {
                const form = createFormWithObject();
                form.field("address.street").setValue("123 Main St");
                form.field("address.city").setValue("Springfield");

                const data = form.getData();
                expect(data.address).toEqual({
                    street: "123 Main St",
                    city: "Springfield"
                });
            });

            it("should hydrate children from setData", () => {
                const form = createFormWithObject();
                form.setData({
                    title: "Home",
                    address: { street: "456 Oak Ave", city: "Portland" }
                });

                expect(form.field("address.street").getValue()).toBe("456 Oak Ave");
                expect(form.field("address.city").getValue()).toBe("Portland");
            });

            it("should not be dirty after setData", () => {
                const form = createFormWithObject();
                form.setData({
                    title: "Home",
                    address: { street: "456 Oak Ave", city: "Portland" }
                });
                expect(form.isDirty).toBe(false);
            });

            it("should be dirty after changing a child field", () => {
                const form = createFormWithObject();
                form.setData({
                    title: "Home",
                    address: { street: "456 Oak Ave", city: "Portland" }
                });
                form.field("address.street").setValue("789 Pine Rd");
                expect(form.isDirty).toBe(true);
            });

            it("should validate children recursively", async () => {
                const form = createFormWithObject();
                const valid = await form.validate();

                expect(valid).toBe(false);
                expect(form.errors.length).toBeGreaterThan(0);
                // The object field itself reports the error
                expect(form.errors.some(e => e.path === "address")).toBe(true);
            });

            it("should pass validation when children are valid", async () => {
                const form = createFormWithObject();
                form.field("title").setValue("Home");
                form.field("address.street").setValue("123 Main St");
                form.field("address.city").setValue("Springfield");

                const valid = await form.validate();
                expect(valid).toBe(true);
            });

            it("should expose IObjectFieldVM from field.vm", () => {
                const form = createFormWithObject();
                form.field("address.street").setValue("123 Main St");
                form.field("address.city").setValue("Springfield");

                const vm = form.field("address").vm as IObjectFieldVM;
                expect(vm.type).toBe("object");
                expect(vm.isList).toBe(false);
                expect(vm.fields).toHaveLength(2);
                expect(vm.fields[0].name).toBe("street");
                expect(vm.fields[0].value).toBe("123 Main St");
                expect(vm.fields[1].name).toBe("city");
                expect(vm.items).toHaveLength(0);
            });

            it("should render object field in a row via default layout", () => {
                const form = new FormModel({
                    fields: fields => ({
                        address: fields
                            .object()
                            .label("Address")
                            .fields(f => ({
                                street: f.text().label("Street"),
                                city: f.text().label("City")
                            }))
                    })
                });

                const vm = form.vm;
                expect(vm.layout).toHaveLength(1);
                expect(vm.layout[0].type).toBe("row");
                const row = asRow(vm.layout[0]);
                expect(row.fields[0].type).toBe("object");
                expect(row.fields[0].name).toBe("address");
            });

            it("should reset to baseline values", () => {
                const form = createFormWithObject();
                form.setData({
                    title: "Home",
                    address: { street: "Original St", city: "Original City" }
                });

                form.field("address.street").setValue("Changed St");
                expect(form.isDirty).toBe(true);

                form.reset();
                expect(form.field("address.street").getValue()).toBe("Original St");
                expect(form.isDirty).toBe(false);
            });

            it("should submit nested data when valid", async () => {
                const form = createFormWithObject();
                form.field("title").setValue("Home");
                form.field("address.street").setValue("123 Main St");
                form.field("address.city").setValue("Springfield");

                const result = await form.submit();
                expect(result).toEqual({
                    title: "Home",
                    address: {
                        street: "123 Main St",
                        city: "Springfield"
                    }
                });
            });
        });

        describe("list object field", () => {
            function createFormWithList() {
                return new FormModel({
                    fields: fields => ({
                        presets: fields
                            .object()
                            .label("Presets")
                            .fields(f => ({
                                name: f.text().label("Name").required("Name is required"),
                                model: f.text().label("Model").required("Model is required")
                            }))
                            .list()
                    }),
                    layout: layout => [layout.row("presets")]
                });
            }

            it("should create a list object field", () => {
                const form = createFormWithList();
                const field = form.field("presets");
                expect(field.type).toBe("object");
            });

            it("should return empty array from getData initially", () => {
                const form = createFormWithList();
                expect(form.getData().presets).toEqual([]);
            });

            it("should add items via the field VM", () => {
                const form = createFormWithList();
                const vm = form.field("presets").vm as IObjectFieldVM;
                expect(vm.isList).toBe(true);
                expect(vm.items).toHaveLength(0);

                vm.addItem();

                const updatedVm = form.field("presets").vm as IObjectFieldVM;
                expect(updatedVm.items).toHaveLength(1);
                expect(updatedVm.items[0].fields).toHaveLength(2);
                expect(updatedVm.items[0].fields[0].name).toBe("name");
            });

            it("should hydrate list from setData", () => {
                const form = createFormWithList();
                form.setData({
                    presets: [
                        { name: "Default", model: "claude-sonnet" },
                        { name: "Fast", model: "claude-haiku" }
                    ]
                });

                const data = form.getData();
                expect(data.presets).toEqual([
                    { name: "Default", model: "claude-sonnet" },
                    { name: "Fast", model: "claude-haiku" }
                ]);
            });

            it("should expose items via IObjectFieldVM", () => {
                const form = createFormWithList();
                form.setData({
                    presets: [
                        { name: "Default", model: "claude-sonnet" },
                        { name: "Fast", model: "claude-haiku" }
                    ]
                });

                const vm = form.field("presets").vm as IObjectFieldVM;
                expect(vm.items).toHaveLength(2);
                expect(vm.items[0].fields[0].value).toBe("Default");
                expect(vm.items[1].fields[1].value).toBe("claude-haiku");
            });

            it("should remove items via item.remove()", () => {
                const form = createFormWithList();
                form.setData({
                    presets: [
                        { name: "Default", model: "claude-sonnet" },
                        { name: "Fast", model: "claude-haiku" }
                    ]
                });

                const vm = form.field("presets").vm as IObjectFieldVM;
                vm.items[0].remove();

                expect(form.getData().presets).toEqual([{ name: "Fast", model: "claude-haiku" }]);
            });

            it("should remove items via removeItem()", () => {
                const form = createFormWithList();
                form.setData({
                    presets: [
                        { name: "A", model: "a" },
                        { name: "B", model: "b" },
                        { name: "C", model: "c" }
                    ]
                });

                const vm = form.field("presets").vm as IObjectFieldVM;
                vm.removeItem(1);

                expect(form.getData().presets).toEqual([
                    { name: "A", model: "a" },
                    { name: "C", model: "c" }
                ]);
            });

            it("should validate all items", async () => {
                const form = createFormWithList();
                form.setData({
                    presets: [
                        { name: "Default", model: "claude-sonnet" },
                        { name: "", model: "" }
                    ]
                });

                const valid = await form.validate();
                expect(valid).toBe(false);
            });

            it("should pass validation when all items are valid", async () => {
                const form = createFormWithList();
                form.setData({
                    presets: [
                        { name: "Default", model: "claude-sonnet" },
                        { name: "Fast", model: "claude-haiku" }
                    ]
                });

                const valid = await form.validate();
                expect(valid).toBe(true);
            });

            it("should validate with listSchema", async () => {
                const form = new FormModel({
                    fields: fields => ({
                        presets: fields
                            .object()
                            .label("Presets")
                            .fields(f => ({
                                name: f.text().label("Name")
                            }))
                            .list()
                            .listSchema(z.array(z.any()).min(2, "At least 2 presets are required"))
                    })
                });

                form.setData({ presets: [{ name: "Only one" }] });
                const valid = await form.validate();

                expect(valid).toBe(false);
                expect(form.errors[0].message).toBe("At least 2 presets are required");
            });

            it("should be dirty after adding an item", () => {
                const form = createFormWithList();
                form.setData({ presets: [] });
                expect(form.isDirty).toBe(false);

                const vm = form.field("presets").vm as IObjectFieldVM;
                vm.addItem();
                expect(form.isDirty).toBe(true);
            });

            it("should have stable keys across re-renders", () => {
                const form = createFormWithList();
                form.setData({
                    presets: [
                        { name: "A", model: "a" },
                        { name: "B", model: "b" }
                    ]
                });

                const vm1 = form.field("presets").vm as IObjectFieldVM;
                const key0 = vm1.items[0].key;
                const key1 = vm1.items[1].key;

                // Re-read VM — keys should be the same
                const vm2 = form.field("presets").vm as IObjectFieldVM;
                expect(vm2.items[0].key).toBe(key0);
                expect(vm2.items[1].key).toBe(key1);
            });

            it("should pass empty list validation when not required", async () => {
                const form = createFormWithList();
                const valid = await form.validate();
                expect(valid).toBe(true);
            });

            it("should modify item field values via VM onChange", () => {
                const form = createFormWithList();
                form.setData({
                    presets: [{ name: "Default", model: "claude-sonnet" }]
                });

                const vm = form.field("presets").vm as IObjectFieldVM;
                vm.items[0].fields[0].onChange("Updated");

                expect((form.getData().presets as any[])[0].name).toBe("Updated");
            });
        });

        describe("hasErrors rollup through tabs", () => {
            it("should report hasErrors in tabs containing object fields", async () => {
                const form = new FormModel({
                    fields: fields => ({
                        title: fields.text().label("Title"),
                        address: fields
                            .object()
                            .label("Address")
                            .fields(f => ({
                                street: f.text().label("Street").required("Required")
                            }))
                    }),
                    layout: layout => [
                        layout.tabs({
                            id: "settings",
                            tabs: [
                                {
                                    id: "general",
                                    label: "General",
                                    layout: [layout.row("title")]
                                },
                                {
                                    id: "details",
                                    label: "Details",
                                    layout: [layout.row("address")]
                                }
                            ]
                        })
                    ]
                });

                form.field("title").setValue("Hello");
                await form.validate();

                const tabsNode = form.vm.layout[0] as ITabsNodeVM;
                expect(tabsNode.tabs[0].hasErrors).toBe(false);
                expect(tabsNode.tabs[1].hasErrors).toBe(true);
            });
        });
    });

    describe("templated object fields (Phase 8a)", () => {
        function createFormWithTemplatedObject() {
            return new FormModel({
                fields: fields => ({
                    content: fields
                        .object()
                        .label("Content")
                        .templates([
                            {
                                id: "hero",
                                name: "Hero Banner",
                                fields: f => ({
                                    heading: f.text().label("Heading").required("Required"),
                                    image: f.text().label("Image")
                                })
                            },
                            {
                                id: "text",
                                name: "Rich Text",
                                fields: f => ({
                                    body: f.text().label("Body").required("Required")
                                })
                            }
                        ])
                })
            });
        }

        describe("shape", () => {
            it("starts with no active template and empty children", () => {
                const form = createFormWithTemplatedObject();
                const field = form.field("content") as any;
                expect(field.isTemplated).toBe(true);
                expect(field.activeTemplateId).toBeNull();
                expect(field.children.size).toBe(0);
            });

            it("exposes available templates via VM", () => {
                const form = createFormWithTemplatedObject();
                const vm = form.field("content").vm as IObjectFieldVM;
                expect(vm.isTemplated).toBe(true);
                expect(vm.availableTemplates).toEqual([
                    { id: "hero", name: "Hero Banner" },
                    { id: "text", name: "Rich Text" }
                ]);
                expect(vm.activeTemplateId).toBeNull();
                expect(vm.fields).toEqual([]);
            });

            it("rejects .fields() alongside .templates() at build time", () => {
                expect(
                    () =>
                        new FormModel({
                            fields: fields => ({
                                content: fields
                                    .object()
                                    .fields(f => ({ x: f.text() }))
                                    .templates([
                                        { id: "a", name: "A", fields: f => ({ y: f.text() }) }
                                    ])
                            })
                        })
                ).toThrow(/both .fields\(\) and .templates\(\)/);
            });

            it("rejects duplicate template ids", () => {
                expect(
                    () =>
                        new FormModel({
                            fields: fields => ({
                                content: fields.object().templates([
                                    { id: "a", name: "A1", fields: f => ({ x: f.text() }) },
                                    { id: "a", name: "A2", fields: f => ({ y: f.text() }) }
                                ])
                            })
                        })
                ).toThrow(/Duplicate template id "a"/);
            });

            it("rejects reserved _templateId as template id", () => {
                expect(
                    () =>
                        new FormModel({
                            fields: fields => ({
                                content: fields.object().templates([
                                    {
                                        id: "_templateId",
                                        name: "X",
                                        fields: f => ({ x: f.text() })
                                    }
                                ])
                            })
                        })
                ).toThrow(/reserved/);
            });

            it("rejects _templateId as a child field name in a template", () => {
                expect(
                    () =>
                        new FormModel({
                            fields: fields => ({
                                content: fields.object().templates([
                                    {
                                        id: "hero",
                                        name: "Hero",
                                        fields: f => ({ _templateId: f.text() })
                                    }
                                ])
                            })
                        })
                ).toThrow(/reserved field "_templateId"/);
            });

            it("allows combining .list() with .templates() (Phase 8b)", () => {
                expect(
                    () =>
                        new FormModel({
                            fields: fields => ({
                                content: fields
                                    .object()
                                    .list()
                                    .templates([
                                        { id: "a", name: "A", fields: f => ({ x: f.text() }) }
                                    ])
                            })
                        })
                ).not.toThrow();
            });
        });

        describe("setTemplate / switching", () => {
            it("builds children when a template is selected", () => {
                const form = createFormWithTemplatedObject();
                const field = form.field("content") as any;

                field.setTemplate("hero");

                expect(field.activeTemplateId).toBe("hero");
                expect(field.children.size).toBe(2);
                expect(form.field("content.heading").type).toBe("text");
                expect(form.field("content.image").type).toBe("text");
            });

            it("discards data when switching to a different template", () => {
                const form = createFormWithTemplatedObject();
                const field = form.field("content") as any;

                field.setTemplate("hero");
                form.field("content.heading").setValue("Hello");

                field.setTemplate("text");

                expect(field.activeTemplateId).toBe("text");
                expect(form.field("content.body")).toBeDefined();
                expect(() => form.field("content.heading")).toThrow();
            });

            it("is a no-op when setting the currently active template", () => {
                const form = createFormWithTemplatedObject();
                const field = form.field("content") as any;

                field.setTemplate("hero");
                form.field("content.heading").setValue("Preserved");
                field.setTemplate("hero");

                expect(form.field("content.heading").getValue()).toBe("Preserved");
            });

            it("throws when setting an unknown template id", () => {
                const form = createFormWithTemplatedObject();
                const field = form.field("content") as any;
                expect(() => field.setTemplate("missing")).toThrow(/Template "missing" not found/);
            });

            it("wires the form reference on newly created children", () => {
                const form = createFormWithTemplatedObject();
                const field = form.field("content") as any;
                field.setTemplate("hero");
                // Setting a value on a child requires _form to be wired for pipelines.
                expect(() => form.field("content.heading").setValue("OK")).not.toThrow();
            });
        });

        describe("getData / setData", () => {
            it("returns null when no template is active", () => {
                const form = createFormWithTemplatedObject();
                expect(form.getData().content).toBeNull();
            });

            it("includes _templateId and child values when active", () => {
                const form = createFormWithTemplatedObject();
                const field = form.field("content") as any;
                field.setTemplate("hero");
                form.field("content.heading").setValue("Welcome");
                form.field("content.image").setValue("cover.jpg");

                expect(form.getData().content).toEqual({
                    _templateId: "hero",
                    heading: "Welcome",
                    image: "cover.jpg"
                });
            });

            it("hydrates via setData by reading _templateId", () => {
                const form = createFormWithTemplatedObject();
                form.setData({
                    content: { _templateId: "text", body: "Lorem ipsum" }
                });

                const field = form.field("content") as any;
                expect(field.activeTemplateId).toBe("text");
                expect(form.field("content.body").getValue()).toBe("Lorem ipsum");
            });

            it("setData with null clears the active template", () => {
                const form = createFormWithTemplatedObject();
                const field = form.field("content") as any;
                field.setTemplate("hero");
                form.field("content.heading").setValue("X");

                form.setData({ content: null as any });

                expect(field.activeTemplateId).toBeNull();
                expect(field.children.size).toBe(0);
            });

            it("setData ignores unknown template id silently", () => {
                const form = createFormWithTemplatedObject();
                form.setData({
                    content: { _templateId: "nope", foo: "bar" } as any
                });
                const field = form.field("content") as any;
                expect(field.activeTemplateId).toBeNull();
            });
        });

        describe("validation", () => {
            it("required templated object fails validation when no template active", async () => {
                const form = new FormModel({
                    fields: fields => ({
                        content: fields
                            .object()
                            .required("Pick a template")
                            .templates([
                                {
                                    id: "hero",
                                    name: "Hero",
                                    fields: f => ({ heading: f.text() })
                                }
                            ])
                    })
                });

                const valid = await form.validate();
                expect(valid).toBe(false);
                expect(form.errors.some(e => e.path === "content")).toBe(true);
            });

            it("required templated object passes when template active with valid children", async () => {
                const form = new FormModel({
                    fields: fields => ({
                        content: fields
                            .object()
                            .required("Pick a template")
                            .templates([
                                {
                                    id: "hero",
                                    name: "Hero",
                                    fields: f => ({
                                        heading: f.text().required("Required")
                                    })
                                }
                            ])
                    })
                });

                const field = form.field("content") as any;
                field.setTemplate("hero");
                form.field("content.heading").setValue("Hi");

                const valid = await form.validate();
                expect(valid).toBe(true);
            });

            it("validates child fields inside active template", async () => {
                const form = createFormWithTemplatedObject();
                const field = form.field("content") as any;
                field.setTemplate("hero");
                // heading is required; no value set
                const valid = await form.validate();
                expect(valid).toBe(false);
            });

            it("passes validation when object is optional and no template selected", async () => {
                const form = createFormWithTemplatedObject();
                const valid = await form.validate();
                expect(valid).toBe(true);
            });
        });

        describe("template visibility", () => {
            it("filters availableTemplates by reactive visible callback", () => {
                const form = new FormModel({
                    fields: fields => ({
                        plan: fields.text().defaultValue("free"),
                        content: fields.object().templates([
                            {
                                id: "basic",
                                name: "Basic",
                                fields: f => ({ x: f.text() })
                            },
                            {
                                id: "premium",
                                name: "Premium",
                                visible: f => f.field("plan").getValue() === "enterprise",
                                fields: f => ({ y: f.text() })
                            }
                        ])
                    })
                });

                const vm1 = form.field("content").vm as IObjectFieldVM;
                expect(vm1.availableTemplates.map(t => t.id)).toEqual(["basic"]);

                form.field("plan").setValue("enterprise");
                const vm2 = form.field("content").vm as IObjectFieldVM;
                expect(vm2.availableTemplates.map(t => t.id)).toEqual(["basic", "premium"]);
            });

            it("hiding a template does not clear an already-active selection", () => {
                const form = new FormModel({
                    fields: fields => ({
                        plan: fields.text().defaultValue("enterprise"),
                        content: fields.object().templates([
                            {
                                id: "premium",
                                name: "Premium",
                                visible: f => f.field("plan").getValue() === "enterprise",
                                fields: f => ({ y: f.text() })
                            }
                        ])
                    })
                });

                const field = form.field("content") as any;
                field.setTemplate("premium");
                form.field("content.y").setValue("set");

                form.field("plan").setValue("free");

                // Template no longer in picker, but active selection + data preserved.
                const vm = form.field("content").vm as IObjectFieldVM;
                expect(vm.availableTemplates).toEqual([]);
                expect(vm.activeTemplateId).toBe("premium");
                expect(form.field("content.y").getValue()).toBe("set");
            });
        });

        describe("isDirty", () => {
            it("is not dirty after setData with template", () => {
                const form = createFormWithTemplatedObject();
                form.setData({
                    content: { _templateId: "hero", heading: "Hello", image: "" }
                });
                expect(form.isDirty).toBe(false);
            });

            it("becomes dirty after switching template", () => {
                const form = createFormWithTemplatedObject();
                form.setData({
                    content: { _templateId: "hero", heading: "Hello", image: "" }
                });
                (form.field("content") as any).setTemplate("text");
                expect(form.isDirty).toBe(true);
            });
        });
    });

    describe("templated list fields (Phase 8b)", () => {
        function createFormWithTemplatedList() {
            return new FormModel({
                fields: fields => ({
                    sections: fields
                        .object()
                        .label("Sections")
                        .list()
                        .templates([
                            {
                                id: "hero",
                                name: "Hero",
                                fields: f => ({
                                    heading: f.text().required("Required"),
                                    image: f.text()
                                })
                            },
                            {
                                id: "text",
                                name: "Text",
                                fields: f => ({
                                    body: f.text().required("Required")
                                })
                            }
                        ])
                })
            });
        }

        describe("addItem / templateId", () => {
            it("requires a template id when adding to a templated list", () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                expect(() => field.addItem()).toThrow(/require a template id/);
            });

            it("rejects unknown template ids", () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                expect(() => field.addItem("missing")).toThrow(/Template "missing" not found/);
            });

            it("adds an item with the picked template's children", () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                field.addItem("hero");

                expect(field.items.length).toBe(1);
                expect(field.items[0].templateId).toBe("hero");
                expect(field.items[0].children.has("heading")).toBe(true);
                expect(field.items[0].children.has("image")).toBe(true);
            });

            it("allows mixing different templates across items", () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                field.addItem("hero");
                field.addItem("text");
                field.addItem("hero");

                expect(field.items.map((i: any) => i.templateId)).toEqual(["hero", "text", "hero"]);
            });
        });

        describe("getData", () => {
            it("includes _templateId per item", () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                field.addItem("hero");
                field.items[0].children.get("heading").setValue("Welcome");
                field.addItem("text");
                field.items[1].children.get("body").setValue("Lorem");

                expect(form.getData().sections).toEqual([
                    { _templateId: "hero", heading: "Welcome", image: null },
                    { _templateId: "text", body: "Lorem" }
                ]);
            });
        });

        describe("setData", () => {
            it("hydrates items by reading each item's _templateId", () => {
                const form = createFormWithTemplatedList();
                form.setData({
                    sections: [
                        { _templateId: "hero", heading: "H1", image: "img.jpg" },
                        { _templateId: "text", body: "Body copy" }
                    ]
                });

                const field = form.field("sections") as any;
                expect(field.items.length).toBe(2);
                expect(field.items[0].templateId).toBe("hero");
                expect(field.items[0].children.get("heading").getValue()).toBe("H1");
                expect(field.items[1].templateId).toBe("text");
                expect(field.items[1].children.get("body").getValue()).toBe("Body copy");
            });

            it("silently drops items with invalid or missing _templateId", () => {
                const form = createFormWithTemplatedList();
                form.setData({
                    sections: [
                        { _templateId: "hero", heading: "Keep" },
                        { _templateId: "nope", x: 1 } as any,
                        { heading: "no-id" } as any,
                        null as any,
                        { _templateId: "text", body: "Also keep" }
                    ]
                });

                const field = form.field("sections") as any;
                expect(field.items.length).toBe(2);
                expect(field.items.map((i: any) => i.templateId)).toEqual(["hero", "text"]);
            });
        });

        describe("duplicate / move / remove", () => {
            it("duplicates an item preserving templateId and values", () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                field.addItem("hero");
                field.items[0].children.get("heading").setValue("Original");
                field.items[0].children.get("image").setValue("pic.jpg");

                field.duplicateItem(0);

                expect(field.items.length).toBe(2);
                expect(field.items[1].templateId).toBe("hero");
                expect(field.items[1].children.get("heading").getValue()).toBe("Original");
                expect(field.items[1].children.get("image").getValue()).toBe("pic.jpg");
                expect(field.items[0].key).not.toBe(field.items[1].key);
            });

            it("moves items while preserving templateId", () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                field.addItem("hero");
                field.addItem("text");
                field.moveItem(0, 1);

                expect(field.items.map((i: any) => i.templateId)).toEqual(["text", "hero"]);
            });

            it("removes items by index", () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                field.addItem("hero");
                field.addItem("text");
                field.removeItem(0);

                expect(field.items.length).toBe(1);
                expect(field.items[0].templateId).toBe("text");
            });
        });

        describe("VM", () => {
            it("exposes templateId and duplicate on each item VM", () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                field.addItem("hero");

                const vm = form.field("sections").vm as IObjectFieldVM;
                expect(vm.items.length).toBe(1);
                expect(vm.items[0].templateId).toBe("hero");
                expect(typeof vm.items[0].duplicate).toBe("function");
            });

            it("VM addItem(templateId) appends an item", () => {
                const form = createFormWithTemplatedList();
                const vm = form.field("sections").vm as IObjectFieldVM;
                vm.addItem("hero");
                vm.addItem("text");

                const field = form.field("sections") as any;
                expect(field.items.map((i: any) => i.templateId)).toEqual(["hero", "text"]);
            });

            it("availableTemplates respects reactive visible() on templated lists", () => {
                const form = new FormModel({
                    fields: fields => ({
                        plan: fields.text().defaultValue("free"),
                        sections: fields
                            .object()
                            .list()
                            .templates([
                                { id: "basic", name: "Basic", fields: f => ({ x: f.text() }) },
                                {
                                    id: "premium",
                                    name: "Premium",
                                    visible: f => f.field("plan").getValue() === "enterprise",
                                    fields: f => ({ y: f.text() })
                                }
                            ])
                    })
                });

                const vm1 = form.field("sections").vm as IObjectFieldVM;
                expect(vm1.availableTemplates.map(t => t.id)).toEqual(["basic"]);

                form.field("plan").setValue("enterprise");
                const vm2 = form.field("sections").vm as IObjectFieldVM;
                expect(vm2.availableTemplates.map(t => t.id)).toEqual(["basic", "premium"]);
            });
        });

        describe("validation", () => {
            it("validates each item's children under its template", async () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                field.addItem("hero"); // heading is required, not set
                field.addItem("text");
                field.items[1].children.get("body").setValue("ok");

                const valid = await form.validate();
                expect(valid).toBe(false);
                expect(form.errors.some(e => e.path.startsWith("sections"))).toBe(true);
            });

            it("passes when every item's required fields are filled", async () => {
                const form = createFormWithTemplatedList();
                const field = form.field("sections") as any;
                field.addItem("hero");
                field.items[0].children.get("heading").setValue("H");
                field.addItem("text");
                field.items[1].children.get("body").setValue("B");

                const valid = await form.validate();
                expect(valid).toBe(true);
            });
        });

        describe("isDirty", () => {
            it("is not dirty after setData with templated list", () => {
                const form = createFormWithTemplatedList();
                form.setData({
                    sections: [
                        { _templateId: "hero", heading: "H", image: "" },
                        { _templateId: "text", body: "B" }
                    ]
                });
                expect(form.isDirty).toBe(false);
            });

            it("becomes dirty after adding an item", () => {
                const form = createFormWithTemplatedList();
                form.setData({
                    sections: [{ _templateId: "hero", heading: "H", image: "" }]
                });
                (form.field("sections") as any).addItem("text");
                expect(form.isDirty).toBe(true);
            });
        });
    });

    describe("per-template / inner object layouts (Phase 8c)", () => {
        describe("non-templated single object", () => {
            it("defaults to one row per visible child when no layout.object() is registered", () => {
                const form = new FormModel({
                    fields: fields => ({
                        meta: fields.object().fields(f => ({
                            a: f.text().label("A"),
                            b: f.text().label("B")
                        }))
                    })
                });
                const vm = form.field("meta").vm as IObjectFieldVM;
                expect(vm.layout.length).toBe(2);
                expect(asRow(vm.layout[0]).fields.map(f => f.name)).toEqual(["a"]);
                expect(asRow(vm.layout[1]).fields.map(f => f.name)).toEqual(["b"]);
            });

            it("resolves the registered inner layout against the children", () => {
                const form = new FormModel({
                    fields: fields => ({
                        meta: fields.object().fields(f => ({
                            a: f.text().label("A"),
                            b: f.text().label("B")
                        }))
                    }),
                    layout: layout => [layout.object("meta", l => [l.row("a", "b")])]
                });
                const vm = form.field("meta").vm as IObjectFieldVM;
                expect(vm.layout.length).toBe(1);
                expect(asRow(vm.layout[0]).fields.map(f => f.name)).toEqual(["a", "b"]);
            });

            it("throws when a per-template map is passed to a non-templated field", () => {
                expect(
                    () =>
                        new FormModel({
                            fields: fields => ({
                                meta: fields.object().fields(f => ({ a: f.text() }))
                            }),
                            layout: layout => [layout.object("meta", { tplA: l => [l.row("a")] })]
                        })
                ).toThrow(/not templated/);
            });
        });

        describe("non-templated list", () => {
            it("applies the inner layout to every list item", () => {
                const form = new FormModel({
                    fields: fields => ({
                        rows: fields
                            .object()
                            .list()
                            .fields(f => ({ a: f.text(), b: f.text() }))
                    }),
                    layout: layout => [layout.object("rows", l => [l.row("a", "b")])]
                });
                const field = form.field("rows") as any;
                field.addItem();
                field.addItem();
                const vm = field.vm as IObjectFieldVM;
                expect(vm.items.length).toBe(2);
                for (const item of vm.items) {
                    expect(item.layout.length).toBe(1);
                    expect(asRow(item.layout[0]).fields.map(f => f.name)).toEqual(["a", "b"]);
                }
            });
        });

        describe("templated single object", () => {
            function createForm(
                layoutFactory?: ConstructorParameters<typeof FormModel>[0]["layout"]
            ) {
                return new FormModel({
                    fields: fields => ({
                        content: fields.object().templates([
                            {
                                id: "hero",
                                name: "Hero",
                                fields: f => ({
                                    heading: f.text().label("Heading"),
                                    subheading: f.text().label("Subheading")
                                })
                            },
                            {
                                id: "cta",
                                name: "CTA",
                                fields: f => ({
                                    text: f.text().label("Text"),
                                    url: f.text().label("URL")
                                })
                            }
                        ])
                    }),
                    layout: layoutFactory
                });
            }

            it("uses the active template's per-template layout", () => {
                const form = createForm(layout => [
                    layout.object("content", {
                        hero: l => [l.row("heading", "subheading")],
                        cta: l => [l.row("text"), l.row("url")]
                    })
                ]);
                const field = form.field("content") as any;
                field.setTemplate("hero");
                let vm = form.field("content").vm as IObjectFieldVM;
                expect(vm.layout.length).toBe(1);
                expect(asRow(vm.layout[0]).fields.map(f => f.name)).toEqual([
                    "heading",
                    "subheading"
                ]);

                field.setTemplate("cta");
                vm = form.field("content").vm as IObjectFieldVM;
                expect(vm.layout.length).toBe(2);
                expect(asRow(vm.layout[0]).fields.map(f => f.name)).toEqual(["text"]);
                expect(asRow(vm.layout[1]).fields.map(f => f.name)).toEqual(["url"]);
            });

            it("falls back to default one-row-per-child when active template has no entry", () => {
                const form = createForm(layout => [
                    layout.object("content", {
                        hero: l => [l.row("heading", "subheading")]
                        // no entry for "cta"
                    })
                ]);
                const field = form.field("content") as any;
                field.setTemplate("cta");
                const vm = form.field("content").vm as IObjectFieldVM;
                expect(vm.layout.length).toBe(2);
                expect(asRow(vm.layout[0]).fields.map(f => f.name)).toEqual(["text"]);
                expect(asRow(vm.layout[1]).fields.map(f => f.name)).toEqual(["url"]);
            });

            it("returns an empty layout when no template is active", () => {
                const form = createForm(layout => [
                    layout.object("content", { hero: l => [l.row("heading", "subheading")] })
                ]);
                const vm = form.field("content").vm as IObjectFieldVM;
                expect(vm.activeTemplateId).toBeNull();
                expect(vm.layout).toEqual([]);
            });

            it("silently ignores an unknown template id in the layout map", () => {
                const form = createForm(layout => [
                    layout.object("content", {
                        hero: l => [l.row("heading", "subheading")],
                        unknown: l => [l.row("xxx")]
                    })
                ]);
                // Should not throw at build time; the unknown entry is dead until referenced.
                const field = form.field("content") as any;
                field.setTemplate("hero");
                const vm = form.field("content").vm as IObjectFieldVM;
                expect(asRow(vm.layout[0]).fields.map(f => f.name)).toEqual([
                    "heading",
                    "subheading"
                ]);
            });

            it("throws when a single LayoutNode[] is passed to a templated field", () => {
                expect(() =>
                    createForm(layout => [layout.object("content", l => [l.row("x")])])
                ).toThrow(/is templated/);
            });

            it("falls back to default when no layout.object() is registered", () => {
                const form = createForm();
                const field = form.field("content") as any;
                field.setTemplate("hero");
                const vm = form.field("content").vm as IObjectFieldVM;
                expect(vm.layout.length).toBe(2);
                expect(asRow(vm.layout[0]).fields.map(f => f.name)).toEqual(["heading"]);
                expect(asRow(vm.layout[1]).fields.map(f => f.name)).toEqual(["subheading"]);
            });
        });

        describe("templated list", () => {
            function createForm() {
                return new FormModel({
                    fields: fields => ({
                        sections: fields
                            .object()
                            .list()
                            .templates([
                                {
                                    id: "hero",
                                    name: "Hero",
                                    fields: f => ({
                                        heading: f.text().label("Heading"),
                                        subheading: f.text().label("Subheading")
                                    })
                                },
                                {
                                    id: "cta",
                                    name: "CTA",
                                    fields: f => ({
                                        text: f.text().label("Text"),
                                        url: f.text().label("URL")
                                    })
                                }
                            ])
                    }),
                    layout: layout => [
                        layout.object("sections", {
                            hero: l => [l.row("heading", "subheading")],
                            cta: l => [l.row("text"), l.row("url")]
                        })
                    ]
                });
            }

            it("each item resolves layout against its own template", () => {
                const form = createForm();
                const field = form.field("sections") as any;
                field.addItem("hero");
                field.addItem("cta");
                const vm = form.field("sections").vm as IObjectFieldVM;
                expect(vm.items.length).toBe(2);
                expect(asRow(vm.items[0].layout[0]).fields.map(f => f.name)).toEqual([
                    "heading",
                    "subheading"
                ]);
                expect(asRow(vm.items[1].layout[0]).fields.map(f => f.name)).toEqual(["text"]);
                expect(asRow(vm.items[1].layout[1]).fields.map(f => f.name)).toEqual(["url"]);
            });

            it("hides hidden child fields from the resolved layout row", () => {
                const form = new FormModel({
                    fields: fields => ({
                        content: fields.object().templates([
                            {
                                id: "hero",
                                name: "Hero",
                                fields: f => ({
                                    heading: f.text(),
                                    secret: f.text().hidden()
                                })
                            }
                        ])
                    }),
                    layout: layout => [
                        layout.object("content", {
                            hero: l => [l.row("heading", "secret")]
                        })
                    ]
                });
                const field = form.field("content") as any;
                field.setTemplate("hero");
                const vm = form.field("content").vm as IObjectFieldVM;
                expect(asRow(vm.layout[0]).fields.map(f => f.name)).toEqual(["heading"]);
            });
        });

        describe("interaction with form.vm.layout", () => {
            it("the form layout exposes a single-field row for the object", () => {
                const form = new FormModel({
                    fields: fields => ({
                        content: fields
                            .object()
                            .templates([
                                { id: "hero", name: "Hero", fields: f => ({ heading: f.text() }) }
                            ])
                    }),
                    layout: layout => [layout.object("content", { hero: l => [l.row("heading")] })]
                });
                const layout = form.vm.layout;
                expect(layout.length).toBe(1);
                const row = asRow(layout[0]);
                expect(row.fields.map(f => f.name)).toEqual(["content"]);
            });

            it("hides the object node from form.vm.layout when the field is not visible", () => {
                const form = new FormModel({
                    fields: fields => ({
                        content: fields
                            .object()
                            .hidden()
                            .templates([
                                { id: "hero", name: "Hero", fields: f => ({ heading: f.text() }) }
                            ])
                    }),
                    layout: layout => [layout.object("content", { hero: l => [l.row("heading")] })]
                });
                expect(form.vm.layout).toEqual([]);
            });
        });
    });

    describe("runtime template modification (Phase 8d)", () => {
        function createSingleTemplatedForm() {
            return new FormModel({
                fields: fields => ({
                    content: fields.object().templates([
                        {
                            id: "hero",
                            name: "Hero",
                            fields: f => ({ heading: f.text() })
                        }
                    ])
                })
            });
        }

        function createListTemplatedForm() {
            return new FormModel({
                fields: fields => ({
                    blocks: fields
                        .object()
                        .list()
                        .templates([
                            {
                                id: "hero",
                                name: "Hero",
                                fields: f => ({ heading: f.text() })
                            },
                            {
                                id: "text",
                                name: "Text",
                                fields: f => ({ body: f.text() })
                            }
                        ])
                })
            });
        }

        it("templates.add appends a template and the picker lists it", () => {
            const form = createSingleTemplatedForm();
            const field = form.field("content").as("object");
            field.templates.add({
                id: "text",
                name: "Text",
                fields: f => ({ body: f.text() })
            });
            const vm = form.field("content").vm as IObjectFieldVM;
            expect(vm.availableTemplates.map(t => t.id)).toEqual(["hero", "text"]);
        });

        it("templates.add throws on duplicate id", () => {
            const form = createSingleTemplatedForm();
            const field = form.field("content").as("object");
            expect(() =>
                field.templates.add({
                    id: "hero",
                    name: "Other",
                    fields: f => ({ x: f.text() })
                })
            ).toThrow(/Duplicate template id "hero"/);
        });

        it("templates.add throws on reserved _templateId", () => {
            const form = createSingleTemplatedForm();
            const field = form.field("content").as("object");
            expect(() =>
                field.templates.add({
                    id: "_templateId",
                    name: "Reserved",
                    fields: f => ({ x: f.text() })
                })
            ).toThrow(/reserved/);
        });

        it("templates.add throws when the template defines a reserved _templateId field", () => {
            const form = createSingleTemplatedForm();
            const field = form.field("content").as("object");
            expect(() =>
                field.templates.add({
                    id: "bad",
                    name: "Bad",
                    fields: f => ({ _templateId: f.text() })
                })
            ).toThrow(/reserved field "_templateId"/);
        });

        it("templates.remove removes the template from the picker", () => {
            const form = createListTemplatedForm();
            const field = form.field("blocks").as("object");
            field.templates.remove("text");
            const vm = form.field("blocks").vm as IObjectFieldVM;
            expect(vm.availableTemplates.map(t => t.id)).toEqual(["hero"]);
        });

        it("templates.remove silently no-ops on unknown id", () => {
            const form = createListTemplatedForm();
            const field = form.field("blocks").as("object");
            const before = (form.field("blocks").vm as IObjectFieldVM).availableTemplates.length;
            expect(() => field.templates.remove("nonExistent")).not.toThrow();
            const after = (form.field("blocks").vm as IObjectFieldVM).availableTemplates.length;
            expect(after).toBe(before);
        });

        it("templates.remove clears active template on a single-object field via onChange(null) semantics", () => {
            const form = createSingleTemplatedForm();
            const field = form.field("content").as("object");
            field.setTemplate("hero");
            expect(field.activeTemplateId).toBe("hero");
            field.templates.remove("hero");
            expect(field.activeTemplateId).toBeNull();
            expect(field.children.size).toBe(0);
            expect(form.field("content").getValue()).toBeNull();
        });

        it("templates.remove drops list items whose _templateId matches", () => {
            const form = createListTemplatedForm();
            const field = form.field("blocks").as("object");
            field.addItem("hero", { heading: "H1" });
            field.addItem("text", { body: "B1" });
            field.addItem("hero", { heading: "H2" });
            expect(field.items.length).toBe(3);
            field.templates.remove("hero");
            expect(field.items.length).toBe(1);
            expect(field.items[0].templateId).toBe("text");
        });

        it("templates.add throws when called on a non-templated object field", () => {
            const form = new FormModel({
                fields: fields => ({
                    plain: fields.object().fields(f => ({ x: f.text() }))
                })
            });
            const field = form.field("plain").as("object");
            expect(() =>
                field.templates.add({
                    id: "x",
                    name: "X",
                    fields: f => ({ y: f.text() })
                })
            ).toThrow(/not templated/);
        });

        it("templates.remove throws when called on a non-templated object field", () => {
            const form = new FormModel({
                fields: fields => ({
                    plain: fields.object().fields(f => ({ x: f.text() }))
                })
            });
            const field = form.field("plain").as("object");
            expect(() => field.templates.remove("anything")).toThrow(/not templated/);
        });

        it("orphan layout entry persists silently and is reused when the same template id is re-added", () => {
            const form = new FormModel({
                fields: fields => ({
                    content: fields.object().templates([
                        {
                            id: "hero",
                            name: "Hero",
                            fields: f => ({ heading: f.text(), subheading: f.text() })
                        }
                    ])
                }),
                layout: layout => [
                    layout.object("content", {
                        hero: l => [l.row("heading", "subheading")]
                    })
                ]
            });
            const field = form.field("content").as("object");
            field.setTemplate("hero");
            const vmBefore = form.field("content").vm as IObjectFieldVM;
            const rowBefore = asRow(vmBefore.layout[0]);
            expect(rowBefore.fields.map(f => f.name)).toEqual(["heading", "subheading"]);

            field.templates.remove("hero");
            field.templates.add({
                id: "hero",
                name: "Hero v2",
                fields: f => ({ heading: f.text(), subheading: f.text() })
            });
            field.setTemplate("hero");

            const vmAfter = form.field("content").vm as IObjectFieldVM;
            const rowAfter = asRow(vmAfter.layout[0]);
            expect(rowAfter.fields.map(f => f.name)).toEqual(["heading", "subheading"]);
        });

        it("removing all templates does not emit dev warnings (orphan suppression)", () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
            const form = createSingleTemplatedForm();
            const field = form.field("content").as("object");
            field.templates.remove("hero");
            const vm = form.field("content").vm as IObjectFieldVM;
            expect(vm.availableTemplates).toEqual([]);
            expect(warn).not.toHaveBeenCalled();
            warn.mockRestore();
        });
    });

    describe("requiredWhen (Phase 11)", () => {
        it("makes a field required when the callback returns true", async () => {
            const form = new FormModel({
                fields: fields => ({
                    plan: fields.text().defaultValue("free"),
                    seats: fields
                        .text()
                        .requiredWhen(f => f.field("plan").getValue() === "pro", "Seats required")
                })
            });

            // plan = free → not required → validation passes
            expect(form.field("seats").vm.required).toBe(false);
            expect(await form.validate()).toBe(true);

            // plan = pro → becomes required → empty value fails validation
            form.field("plan").setValue("pro");
            expect(form.field("seats").vm.required).toBe(true);
            expect(await form.validate()).toBe(false);
            expect(form.field("seats").vm.validation.message).toBe("Seats required");
        });

        it("chains requiredWhen callbacks — first truthy wins", async () => {
            const form = new FormModel({
                fields: fields => ({
                    plan: fields.text().defaultValue("free"),
                    flag: fields.text().defaultValue("off"),
                    seats: fields
                        .text()
                        .requiredWhen(f => f.field("plan").getValue() === "pro", "Pro requires it")
                        .requiredWhen(f => f.field("flag").getValue() === "on", "Flag requires it")
                })
            });

            form.field("flag").setValue("on");
            await form.validate();
            expect(form.field("seats").vm.validation.message).toBe("Flag requires it");

            // First-truthy-wins: enable plan too, plan callback runs first.
            form.field("plan").setValue("pro");
            await form.validate();
            expect(form.field("seats").vm.validation.message).toBe("Pro requires it");
        });

        it("hard .required() always wins over requiredWhen messages", async () => {
            const form = new FormModel({
                fields: fields => ({
                    seats: fields
                        .text()
                        .required("Always required")
                        .requiredWhen(() => true, "Conditional message")
                })
            });

            await form.validate();
            expect(form.field("seats").vm.required).toBe(true);
            expect(form.field("seats").vm.validation.message).toBe("Always required");
        });

        it("modifier-added requiredWhen chains with builder-defined ones", async () => {
            const form = new FormModel({
                fields: fields => ({
                    plan: fields.text().defaultValue("free"),
                    other: fields.text().defaultValue("off"),
                    seats: fields
                        .text()
                        .requiredWhen(f => f.field("plan").getValue() === "pro", "Pro required")
                })
            });

            form.field("seats").addRequiredWhen(
                f => f.field("other").getValue() === "on",
                "Other required"
            );

            // Neither truthy → not required.
            expect(form.field("seats").vm.required).toBe(false);

            // Modifier callback truthy.
            form.field("other").setValue("on");
            await form.validate();
            expect(form.field("seats").vm.validation.message).toBe("Other required");
        });
    });

    describe("computed / computedUntilDirty (Phase 11)", () => {
        it("computed field exposes derived value reactively", () => {
            const form = new FormModel({
                fields: fields => ({
                    first: fields.text().defaultValue("Ada"),
                    last: fields.text().defaultValue("Lovelace"),
                    full: fields
                        .text()
                        .computed(
                            f => `${f.field("first").getValue()} ${f.field("last").getValue()}`
                        )
                })
            });

            expect(form.field("full").getValue()).toBe("Ada Lovelace");
            form.field("first").setValue("Grace");
            expect(form.field("full").getValue()).toBe("Grace Lovelace");
        });

        it("computed field stays editable but value remains derived", () => {
            const form = new FormModel({
                fields: fields => ({
                    src: fields.text().defaultValue("A"),
                    derived: fields.text().computed(f => f.field("src").getValue())
                })
            });

            // Not auto-disabled.
            expect(form.field("derived").vm.disabled).toBe(false);

            // User edit doesn't override the computed value.
            form.field("derived").vm.onChange("manual override");
            expect(form.field("derived").getValue()).toBe("A");
        });

        it("computedUntilDirty switches to manual after first UI edit", () => {
            const form = new FormModel({
                fields: fields => ({
                    src: fields.text().defaultValue("A"),
                    derived: fields
                        .text()
                        .computedUntilDirty(f => `derived-${f.field("src").getValue()}`)
                })
            });

            expect(form.field("derived").getValue()).toBe("derived-A");

            form.field("derived").vm.onChange("manual");
            expect(form.field("derived").getValue()).toBe("manual");

            // Source changes no longer overwrite manual edit.
            form.field("src").setValue("B");
            expect(form.field("derived").getValue()).toBe("manual");
        });

        it("computed field still participates in validation", async () => {
            const form = new FormModel({
                fields: fields => ({
                    src: fields.text().defaultValue(""),
                    derived: fields
                        .text()
                        .required("Derived must not be empty")
                        .computed(f => f.field("src").getValue())
                })
            });

            const valid = await form.validate();
            expect(valid).toBe(false);
            expect(form.field("derived").vm.validation.message).toBe("Derived must not be empty");

            form.field("src").setValue("hello");
            expect(await form.validate()).toBe(true);
        });

        it("modifier setComputed converts a regular field into a computed one", () => {
            const form = new FormModel({
                fields: fields => ({
                    src: fields.text().defaultValue("X"),
                    derived: fields.text().defaultValue("initial")
                })
            });

            form.field("derived").setComputed(f => `from-${f.field("src").getValue()}`);

            expect(form.field("derived").getValue()).toBe("from-X");
            form.field("src").setValue("Y");
            expect(form.field("derived").getValue()).toBe("from-Y");
        });
    });

    describe('field("...").as("object").fields() (Phase 11)', () => {
        it("adds new children to an existing object field at runtime", () => {
            const form = new FormModel({
                fields: fields => ({
                    profile: fields.object().fields(f => ({
                        firstName: f.text().label("First")
                    }))
                })
            });

            form.field("profile")
                .as("object")
                .fields(f => ({
                    lastName: f.text().label("Last")
                }));

            form.field("profile.firstName").setValue("Ada");
            form.field("profile.lastName").setValue("Lovelace");
            expect(form.getData()).toEqual({
                profile: { firstName: "Ada", lastName: "Lovelace" }
            });
        });

        it("replaces existing children when keys collide", () => {
            const form = new FormModel({
                fields: fields => ({
                    profile: fields.object().fields(f => ({
                        firstName: f.text().label("Old")
                    }))
                })
            });

            form.field("profile")
                .as("object")
                .fields(f => ({
                    firstName: f.text().label("New")
                }));

            const profile = form.field("profile").as("object");
            expect(profile.children.get("firstName")?.config.label).toBe("New");
        });

        it("removes children when factory returns undefined", () => {
            const form = new FormModel({
                fields: fields => ({
                    profile: fields.object().fields(f => ({
                        firstName: f.text(),
                        lastName: f.text()
                    }))
                })
            });

            form.field("profile")
                .as("object")
                .fields(() => ({
                    lastName: undefined
                }));

            const profile = form.field("profile").as("object");
            expect(profile.children.has("lastName")).toBe(false);
            expect(profile.children.has("firstName")).toBe(true);
        });

        it("propagates added children to existing list items", () => {
            const form = new FormModel({
                fields: fields => ({
                    contacts: fields
                        .object()
                        .list()
                        .fields(f => ({
                            name: f.text()
                        }))
                })
            });

            const contacts = form.field("contacts").as("object");
            contacts.addItem({ name: "Ada" });
            contacts.addItem({ name: "Grace" });

            contacts.fields(f => ({
                email: f.text()
            }));

            // Existing items now have the new child.
            expect(contacts.items[0].children.has("email")).toBe(true);
            expect(contacts.items[1].children.has("email")).toBe(true);

            // Newly added items pick up the child too.
            contacts.addItem({ name: "Linus", email: "linus@example.com" });
            expect(contacts.items[2].children.get("email")?.getValue()).toBe("linus@example.com");
        });

        it("throws when called on a templated object field", () => {
            const form = new FormModel({
                fields: fields => ({
                    block: fields.object().templates([
                        {
                            id: "a",
                            name: "A",
                            fields: f => ({ x: f.text() })
                        }
                    ])
                })
            });

            expect(() => {
                form.field("block")
                    .as("object")
                    .fields(f => ({ y: f.text() }));
            }).toThrow(/templated/);
        });
    });

    describe("form.addRule() (Phase 11)", () => {
        it("runs a Zod schema against getData() and surfaces issues", async () => {
            const form = new FormModel({
                fields: fields => ({
                    password: fields.text().defaultValue("a"),
                    confirm: fields.text().defaultValue("b")
                })
            });

            form.addRule(
                z
                    .object({
                        password: z.string(),
                        confirm: z.string()
                    })
                    .refine(d => d.password === d.confirm, {
                        message: "Passwords must match",
                        path: ["confirm"]
                    })
            );

            const valid = await form.validate();
            expect(valid).toBe(false);
            expect(form.errors.some(e => e.message === "Passwords must match")).toBe(true);
            // Error surfaced on per-field validation when path matches.
            expect(form.field("confirm").vm.validation.isValid).toBe(false);
            expect(form.field("confirm").vm.validation.message).toBe("Passwords must match");
        });

        it("runs an imperative function and merges returned errors", async () => {
            const form = new FormModel({
                fields: fields => ({
                    age: fields.text().defaultValue("17")
                })
            });

            form.addRule(f => {
                if (Number(f.field("age").getValue()) < 18) {
                    return [{ path: "age", message: "Must be 18+" }];
                }
                return [];
            });

            expect(await form.validate()).toBe(false);
            expect(form.field("age").vm.validation.message).toBe("Must be 18+");

            form.field("age").setValue("21");
            expect(await form.validate()).toBe(true);
        });

        it("supports async imperative rules", async () => {
            const form = new FormModel({
                fields: fields => ({
                    name: fields.text().defaultValue("taken")
                })
            });

            form.addRule(async f => {
                await Promise.resolve();
                if (f.field("name").getValue() === "taken") {
                    return [{ path: "name", message: "Already taken" }];
                }
                return [];
            });

            expect(await form.validate()).toBe(false);
            expect(form.field("name").vm.validation.message).toBe("Already taken");
        });
    });

    describe("form.setLayout() (Phase 11)", () => {
        it("replaces the layout entirely", () => {
            const form = new FormModel({
                fields: fields => ({
                    a: fields.text(),
                    b: fields.text(),
                    c: fields.text()
                }),
                layout: layout => [layout.row("a"), layout.row("b"), layout.row("c")]
            });

            form.setLayout(layout => [layout.row("c", "a")]);

            const layout = form.vm.layout;
            expect(layout).toHaveLength(1);
            const row = asRow(layout[0]);
            expect(row.fields.map(f => f.name)).toEqual(["c", "a"]);
        });

        it("emits orphan warnings for fields not in the new layout", () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
            const form = new FormModel({
                fields: fields => ({
                    a: fields.text(),
                    b: fields.text()
                })
            });

            warn.mockClear();
            form.setLayout(layout => [layout.row("a")]);

            expect(warn).toHaveBeenCalledWith(
                expect.stringContaining('Field "b" is not in the layout')
            );
            warn.mockRestore();
        });
    });
});
