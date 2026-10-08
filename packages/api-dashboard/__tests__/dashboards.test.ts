import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";

const layout = {
    columns: [["wb.pages", "cms.models"], [], ["fm.files"]],
    hidden: ["audit.logs"],
    columnCount: 3
};

describe("dashboards", () => {
    it("lists no dashboards before the first update", async () => {
        const { listDashboards } = useGraphQLHandler();

        expect(await listDashboards()).toEqual({ data: [], error: null });
    });

    it("creates the dashboard on the first update, empty columns included", async () => {
        const { listDashboards, updateDashboard } = useGraphQLHandler();

        expect(await updateDashboard(layout)).toEqual({ data: layout, error: null });
        expect(await listDashboards()).toEqual({ data: [layout], error: null });
    });

    it("overwrites the dashboard on later updates", async () => {
        const { listDashboards, updateDashboard } = useGraphQLHandler();

        await updateDashboard(layout);
        const next = { columns: [["fm.files"], ["wb.pages"]], hidden: [], columnCount: 2 };
        await updateDashboard(next);

        expect(await listDashboards()).toEqual({ data: [next], error: null });
    });

    it("keeps each identity's dashboard separate", async () => {
        const owner = useGraphQLHandler();
        const other = useGraphQLHandler({
            identity: { id: "api-key:abc/123", type: "admin", displayName: "Jane Doe" }
        });

        await owner.updateDashboard(layout);

        expect(await other.listDashboards()).toEqual({ data: [], error: null });

        const otherLayout = { columns: [[], []], hidden: [], columnCount: 2 };
        expect(await other.updateDashboard(otherLayout)).toEqual({
            data: otherLayout,
            error: null
        });
        expect(await owner.listDashboards()).toEqual({ data: [layout], error: null });
    });

    it("rejects a column count outside 2 to 4", async () => {
        const { listDashboards, updateDashboard } = useGraphQLHandler();

        const response = await updateDashboard({ ...layout, columnCount: 5 });

        expect(response.data).toBeNull();
        expect(response.error).toMatchObject({ code: "Dashboard/Validation" });
        expect(await listDashboards()).toEqual({ data: [], error: null });
    });
});
