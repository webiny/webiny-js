import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";

const layout = {
    columns: [["wb.pages", "cms.models"], [], ["fm.files"]],
    hidden: ["audit.logs"],
    columnCount: 3
};

describe("my dashboard", () => {
    it("returns null before the first save", async () => {
        const { getMyDashboard } = useGraphQLHandler();

        expect(await getMyDashboard()).toEqual({ data: null, error: null });
    });

    it("saves a layout and reads it back, empty columns included", async () => {
        const { getMyDashboard, saveMyDashboard } = useGraphQLHandler();

        expect(await saveMyDashboard(layout)).toEqual({ data: layout, error: null });
        expect(await getMyDashboard()).toEqual({ data: layout, error: null });
    });

    it("overwrites the layout on later saves", async () => {
        const { getMyDashboard, saveMyDashboard } = useGraphQLHandler();

        await saveMyDashboard(layout);
        const next = { columns: [["fm.files"], ["wb.pages"]], hidden: [], columnCount: 2 };
        await saveMyDashboard(next);

        expect(await getMyDashboard()).toEqual({ data: next, error: null });
    });

    it("keeps each identity's layout separate", async () => {
        const owner = useGraphQLHandler();
        const other = useGraphQLHandler({
            identity: { id: "api-key:abc/123", type: "admin", displayName: "Jane Doe" }
        });

        await owner.saveMyDashboard(layout);

        expect(await other.getMyDashboard()).toEqual({ data: null, error: null });

        const otherLayout = { columns: [[], []], hidden: [], columnCount: 2 };
        expect(await other.saveMyDashboard(otherLayout)).toEqual({
            data: otherLayout,
            error: null
        });
        expect(await owner.getMyDashboard()).toEqual({ data: layout, error: null });
    });

    it("rejects a column count outside 2 to 4", async () => {
        const { getMyDashboard, saveMyDashboard } = useGraphQLHandler();

        const response = await saveMyDashboard({ ...layout, columnCount: 5 });

        expect(response.data).toBeNull();
        expect(response.error).toMatchObject({ code: "VALIDATION_FAILED_INVALID_FIELDS" });
        expect(await getMyDashboard()).toEqual({ data: null, error: null });
    });
});
