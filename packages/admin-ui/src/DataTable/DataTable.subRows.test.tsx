// @vitest-environment jsdom
/**
 * A DataTable lists a row's sub-rows under it when given `getSubRows`: the row gets a toggle in its
 * first column that shows and hides them, and a selected sub-row is reported as its own entry.
 */
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumns } from "./DataTable.js";

/* No SVG transform in the test runner. */
vi.mock("@webiny/icons/keyboard_arrow_down.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/settings.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/check.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/remove.svg", () => ({ ReactComponent: () => null }));

beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

afterEach(() => {
    cleanup();
});

interface Entry {
    id: string;
    title: string;
    language: string;
    versions?: Entry[];
}

const columns: DataTableColumns<Entry> = {
    title: { header: "Title" },
    language: { header: "Language" }
};

const data: Entry[] = [
    {
        id: "blog",
        title: "Blog",
        language: "en",
        versions: [
            { id: "blog-de", title: "Blog (German)", language: "de" },
            { id: "blog-hr", title: "Blog (Croatian)", language: "hr" }
        ]
    },
    { id: "landing", title: "Landing", language: "en" }
];

const getSubRows = (row: Entry) => row.versions;

const bodyRows = () => {
    return screen.getAllByRole("row").slice(1);
};

describe("DataTable sub-rows", () => {
    it("lists a row's sub-rows under it once its toggle is clicked, and hides them again", () => {
        render(<DataTable<Entry> columns={columns} data={data} getSubRows={getSubRows} />);

        expect(bodyRows().map(row => row.textContent)).toEqual(["Blogen", "Landingen"]);
        // Only a row with sub-rows gets a toggle.
        expect(screen.getAllByRole("button", { name: "Expand row" })).toHaveLength(1);

        act(() => {
            screen.getByRole("button", { name: "Expand row" }).click();
        });

        expect(bodyRows().map(row => row.textContent)).toEqual([
            "Blogen",
            "Blog (German)de",
            "Blog (Croatian)hr",
            "Landingen"
        ]);
        expect(bodyRows().map(row => row.getAttribute("data-depth"))).toEqual(["0", "1", "1", "0"]);
        const toggle = screen.getByRole("button", { name: "Collapse row" });
        expect(toggle.getAttribute("aria-expanded")).toBe("true");

        act(() => {
            toggle.click();
        });

        expect(bodyRows().map(row => row.textContent)).toEqual(["Blogen", "Landingen"]);
        expect(
            screen.getByRole("button", { name: "Expand row" }).getAttribute("aria-expanded")
        ).toBe("false");
    });

    it("shows every row's sub-rows at first with `initialExpanded`", () => {
        render(
            <DataTable<Entry>
                columns={columns}
                data={data}
                getSubRows={getSubRows}
                initialExpanded={true}
            />
        );

        expect(bodyRows()).toHaveLength(4);
        expect(screen.getByRole("button", { name: "Collapse row" })).toBeTruthy();
    });

    it("expands the rows `expanded` names by entry id, and reports a click to `onExpandedChange`", () => {
        const onExpandedChange = vi.fn();

        render(
            <DataTable<Entry>
                columns={columns}
                data={data}
                getSubRows={getSubRows}
                expanded={{ blog: true }}
                onExpandedChange={onExpandedChange}
            />
        );

        expect(bodyRows()).toHaveLength(4);

        act(() => {
            screen.getByRole("button", { name: "Collapse row" }).click();
        });

        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        const updater = onExpandedChange.mock.calls[0][0];
        const next = typeof updater === "function" ? updater({ blog: true }) : updater;
        expect(next).toEqual({});
    });

    it("keeps the new rows' state when the data changes", () => {
        const { rerender } = render(
            <DataTable<Entry> columns={columns} data={data} getSubRows={getSubRows} />
        );

        act(() => {
            screen.getByRole("button", { name: "Expand row" }).click();
        });

        // E.g. a row added by a row action: the expanded row stays expanded.
        rerender(
            <DataTable<Entry>
                columns={columns}
                data={[{ id: "about", title: "About", language: "en" }, ...data]}
                getSubRows={getSubRows}
            />
        );

        expect(bodyRows().map(row => row.textContent)).toEqual([
            "Abouten",
            "Blogen",
            "Blog (German)de",
            "Blog (Croatian)hr",
            "Landingen"
        ]);
    });

    it("reports a selected sub-row as its own entry", () => {
        const onToggleRow = vi.fn();

        render(
            <DataTable<Entry>
                columns={columns}
                data={data}
                getSubRows={getSubRows}
                initialExpanded={true}
                isRowSelectable={() => true}
                onToggleRow={onToggleRow}
                selectedRows={[data[0].versions![1]]}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox", { name: "Select row" });
        // Blog, Blog (German), Blog (Croatian), Landing.
        expect(checkboxes.map(box => box.getAttribute("aria-checked"))).toEqual([
            "false",
            "false",
            "true",
            "false"
        ]);

        act(() => {
            checkboxes[1].click();
        });

        expect(onToggleRow).toHaveBeenCalledWith(data[0].versions![0]);
    });

    it("leaves a table without `getSubRows` flat, with no toggles", () => {
        render(<DataTable<Entry> columns={columns} data={data} />);

        expect(bodyRows().map(row => row.textContent)).toEqual(["Blogen", "Landingen"]);
        expect(screen.queryByRole("button", { name: "Expand row" })).toBeNull();
    });
});
