import { describe, expect, it } from "vitest";
import { LayoutBuilder } from "~/features/modelBuilder/LayoutBuilder";

describe("LayoutBuilder", () => {
    describe("addField", () => {
        it("should add field after target field in same row", () => {
            const layout = [["name", "description"], ["email"]];
            const builder = new LayoutBuilder(layout);

            const result = builder.addField("status", { after: "name" }).build();

            expect(result).toEqual([["name", "status", "description"], ["email"]]);
        });

        it("should add field before target field in same row", () => {
            const layout = [["name", "description"], ["email"]];
            const builder = new LayoutBuilder(layout);

            const result = builder.addField("status", { before: "description" }).build();

            expect(result).toEqual([["name", "status", "description"], ["email"]]);
        });

        it("should throw error if target field not found", () => {
            const layout = [["name"], ["email"]];
            const builder = new LayoutBuilder(layout);

            expect(() => {
                builder.addField("status", { after: "nonexistent" });
            }).toThrow('Cannot add field "status": target field "nonexistent" not found in layout');
        });

        it("should support chaining multiple addField calls", () => {
            const layout = [["name"]];
            const builder = new LayoutBuilder(layout);

            const result = builder
                .addField("status", { after: "name" })
                .addField("priority", { after: "status" })
                .build();

            expect(result).toEqual([["name", "status", "priority"]]);
        });
    });

    describe("addRow", () => {
        it("should append row at the end of layout", () => {
            const layout = [["name"], ["email"]];
            const builder = new LayoutBuilder(layout);

            const result = builder.addRow(["status", "priority"]).build();

            expect(result).toEqual([["name"], ["email"], ["status", "priority"]]);
        });

        it("should work with empty initial layout", () => {
            const builder = new LayoutBuilder([]);

            const result = builder.addRow(["name"]).build();

            expect(result).toEqual([["name"]]);
        });

        it("should support chaining multiple addRow calls", () => {
            const layout = [["name"]];
            const builder = new LayoutBuilder(layout);

            const result = builder.addRow(["email"]).addRow(["status"]).build();

            expect(result).toEqual([["name"], ["email"], ["status"]]);
        });
    });

    describe("insertRow", () => {
        it("should insert row after the row containing target field", () => {
            const layout = [["name"], ["email"], ["status"]];
            const builder = new LayoutBuilder(layout);

            const result = builder.insertRow(["priority"], { after: "name" }).build();

            expect(result).toEqual([["name"], ["priority"], ["email"], ["status"]]);
        });

        it("should insert row before the row containing target field", () => {
            const layout = [["name"], ["email"], ["status"]];
            const builder = new LayoutBuilder(layout);

            const result = builder.insertRow(["priority"], { before: "email" }).build();

            expect(result).toEqual([["name"], ["priority"], ["email"], ["status"]]);
        });

        it("should throw error if target field not found", () => {
            const layout = [["name"], ["email"]];
            const builder = new LayoutBuilder(layout);

            expect(() => {
                builder.insertRow(["status"], { after: "nonexistent" });
            }).toThrow('Cannot insert row: target field "nonexistent" not found in layout');
        });

        it("should insert at correct position when target is in multi-field row", () => {
            const layout = [["name", "description"], ["email"]];
            const builder = new LayoutBuilder(layout);

            const result = builder.insertRow(["status"], { after: "description" }).build();

            expect(result).toEqual([["name", "description"], ["status"], ["email"]]);
        });
    });

    describe("complex scenarios", () => {
        it("should handle combination of addField, addRow, and insertRow", () => {
            const layout = [["name"], ["description"]];
            const builder = new LayoutBuilder(layout);

            const result = builder
                .addField("status", { after: "name" })
                .insertRow(["priority"], { after: "name" })
                .addRow(["email"])
                .build();

            expect(result).toEqual([["name", "status"], ["priority"], ["description"], ["email"]]);
        });

        it("should not mutate original layout", () => {
            const layout = [["name"], ["email"]];
            const builder = new LayoutBuilder(layout);

            builder.addField("status", { after: "name" }).build();

            // Original layout should remain unchanged
            expect(layout).toEqual([["name"], ["email"]]);
        });

        it("should create independent copies on build", () => {
            const builder = new LayoutBuilder([["name"]]);

            const result1 = builder.addRow(["email"]).build();
            const result2 = builder.addRow(["status"]).build();

            // Modifications after first build should affect subsequent builds
            expect(result1).toEqual([["name"], ["email"]]);
            expect(result2).toEqual([["name"], ["email"], ["status"]]);
        });

        it("should handle empty rows", () => {
            const layout = [["name"], [], ["email"]];
            const builder = new LayoutBuilder(layout);

            const result = builder.addRow(["status"]).build();

            expect(result).toEqual([["name"], [], ["email"], ["status"]]);
        });

        it("should work with object field layout extension scenario", () => {
            // Simulating extending theme object layout
            const themeLayout = [["websiteTitle"], ["primaryColor"], ["font"]];
            const builder = new LayoutBuilder(themeLayout);

            const result = builder
                .addField("logoUrl", { after: "font" })
                .insertRow(["customBranding"], { after: "font" })
                .build();

            expect(result).toEqual([
                ["websiteTitle"],
                ["primaryColor"],
                ["font", "logoUrl"],
                ["customBranding"]
            ]);
        });
    });
});
