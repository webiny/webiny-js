import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { buildAppFolders } from "./buildAppFolders.js";
import type { FolderNode } from "./buildAppFolders.js";

const ROOT = "root";

const folder = (id: string, title: string, parentId: string | null): FolderNode => {
    return { id, title, parentId };
};

describe("buildAppFolders", () => {
    it("drops the root row", () => {
        const result = buildAppFolders([folder(ROOT, "Home", "0"), folder("a", "A", ROOT)], ROOT);

        expect(result).toEqual([{ id: "a", path: "/A" }]);
    });

    it("builds the path of a nested folder from the titles through the parent ids", () => {
        const result = buildAppFolders(
            [
                folder(ROOT, "Home", "0"),
                folder("a", "Campaigns", ROOT),
                folder("b", "Spring", "a"),
                folder("c", "Banners", "b")
            ],
            ROOT
        );

        expect(result).toEqual([
            { id: "a", path: "/Campaigns" },
            { id: "b", path: "/Campaigns/Spring" },
            { id: "c", path: "/Campaigns/Spring/Banners" }
        ]);
    });

    it("builds the path whatever the order of the list", () => {
        const result = buildAppFolders(
            [
                folder("c", "Banners", "b"),
                folder("b", "Spring", "a"),
                folder("a", "Campaigns", ROOT)
            ],
            ROOT
        );

        expect(result).toEqual([
            { id: "c", path: "/Campaigns/Spring/Banners" },
            { id: "b", path: "/Campaigns/Spring" },
            { id: "a", path: "/Campaigns" }
        ]);
    });

    it("treats a top-level folder whose parent is null or the root as top level", () => {
        const result = buildAppFolders([folder("a", "A", null), folder("b", "B", ROOT)], ROOT);

        expect(result).toEqual([
            { id: "a", path: "/A" },
            { id: "b", path: "/B" }
        ]);
    });

    it("ends the path at a parent the admin cannot see", () => {
        // The permission-filtered list has no folder `hidden`; its visible child is listed from its own title up.
        const result = buildAppFolders(
            [
                folder(ROOT, "Home", "0"),
                folder("child", "Public", "hidden"),
                folder("a", "A", ROOT)
            ],
            ROOT
        );

        expect(result).toEqual([
            { id: "child", path: "/Public" },
            { id: "a", path: "/A" }
        ]);
    });

    it("keeps two folders with the same title as two entries", () => {
        const result = buildAppFolders(
            [folder("a", "Archive", ROOT), folder("b", "Archive", "a")],
            ROOT
        );

        expect(result).toEqual([
            { id: "a", path: "/Archive" },
            { id: "b", path: "/Archive/Archive" }
        ]);
    });

    it("ends the walk on a cycle in the data", () => {
        const result = buildAppFolders([folder("a", "A", "b"), folder("b", "B", "a")], ROOT);

        expect(result).toEqual([
            { id: "a", path: "/B/A" },
            { id: "b", path: "/A/B" }
        ]);
    });

    it("answers an empty list for an empty list and for only the root", () => {
        expect(buildAppFolders([], ROOT)).toEqual([]);
        expect(buildAppFolders([folder(ROOT, "Home", "0")], ROOT)).toEqual([]);
    });
});
