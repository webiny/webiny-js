import { describe, expect, it } from "vitest";
import { StoreFileInput } from "~/exports/api/file-manager/file.js";

describe("StoreFileInput", () => {
    it("should apply the defaults when only a name is given", () => {
        const input = StoreFileInput.fromBuffer(Buffer.from("hello"), { name: "hello.txt" });

        expect(input.getName()).toBe("hello.txt");
        expect(input.getType()).toBe("text/plain");
        expect(input.getSize()).toBe(5);
        expect(input.getId()).toBeUndefined();
        expect(input.getFolderId()).toBe("root");
        expect(input.getTags()).toEqual([]);
        expect(input.getDescription()).toBe("");
        expect(input.getMetadata()).toEqual({});
    });

    it("should take every attribute from the options", () => {
        const input = StoreFileInput.fromBuffer(new Uint8Array([1, 2, 3]), {
            name: "report",
            type: "application/pdf",
            id: "report-1",
            folderId: "folder-1",
            tags: ["generated", "generated", "monthly"],
            description: "Monthly report",
            metadata: { source: "reports-task" }
        });

        expect(input.getContents()).toEqual(Buffer.from([1, 2, 3]));
        expect(input.getType()).toBe("application/pdf");
        expect(input.getId()).toBe("report-1");
        expect(input.getFolderId()).toBe("folder-1");
        expect(input.getTags()).toEqual(["generated", "monthly"]);
        expect(input.getDescription()).toBe("Monthly report");
        expect(input.getMetadata()).toEqual({ source: "reports-task" });
    });

    it("should resolve the type from the name until a type is set", () => {
        const input = StoreFileInput.fromString("<svg/>", { name: "logo.svg" });
        expect(input.getType()).toBe("image/svg+xml");

        input.setName("logo.png");
        expect(input.getType()).toBe("image/png");

        input.setType("image/webp");
        expect(input.getType()).toBe("image/webp");

        expect(StoreFileInput.fromString("x", { name: "no-extension" }).getType()).toBe(
            "application/octet-stream"
        );
    });

    it("should derive the size from the bytes, also after the contents change", () => {
        const input = StoreFileInput.fromString("ä", { name: "a.txt" });
        expect(input.getSize()).toBe(2);

        input.setContents(Buffer.alloc(1024));
        expect(input.getSize()).toBe(1024);
    });

    it("should chain the setters and change the input in place", () => {
        const input = StoreFileInput.fromString("{}", { name: "data.json", tags: ["a"] });

        const returned = input
            .setId("data-1")
            .setFolder("folder-2")
            .addTag("b")
            .addTag("a")
            .setDescription("Data")
            .setMetadata({ x: 1 });

        expect(returned).toBe(input);
        expect(input.getId()).toBe("data-1");
        expect(input.getFolderId()).toBe("folder-2");
        expect(input.getTags()).toEqual(["a", "b"]);
        expect(input.getDescription()).toBe("Data");
        expect(input.getMetadata()).toEqual({ x: 1 });

        input.setTags(["c"]).setFolder(undefined);
        expect(input.getTags()).toEqual(["c"]);
        expect(input.getFolderId()).toBe("root");
    });

    it("should not be changed through the arrays and objects it returns", () => {
        const input = StoreFileInput.fromString("x", { name: "a.txt", tags: ["a"] });

        input.getTags().push("b");
        input.getMetadata().x = 1;

        expect(input.getTags()).toEqual(["a"]);
        expect(input.getMetadata()).toEqual({});
    });
});
