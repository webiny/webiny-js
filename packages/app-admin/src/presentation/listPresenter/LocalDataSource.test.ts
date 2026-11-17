import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { ListCache } from "~/features/listCache/index.js";
import { LocalDataSource } from "./LocalDataSource.js";

interface Row {
    id: string;
    name: string;
    description?: string | null;
}

const ROWS: Row[] = [
    { id: "1", name: "Editors", description: "Edit content" },
    { id: "2", name: "Reviewers", description: null },
    { id: "3", name: "Admins", description: "Everything" }
];

class RowsDataSource extends LocalDataSource<Row> {
    public readonly cache = new ListCache<Row>();
    public readonly loads = vi.fn(async () => {
        this.cache.setItems(ROWS);
    });

    constructor() {
        super();
    }

    protected get items(): Row[] {
        return this.cache.getItems();
    }

    protected load(): Promise<void> {
        return this.loads();
    }

    protected searchIn(row: Row): Array<string | null | undefined> {
        return [row.name, row.description];
    }
}

const ids = (rows: Row[]) => rows.map(row => row.id);

describe("LocalDataSource", () => {
    it("answers a search from the loaded rows, case-insensitively and across every text", async () => {
        const dataSource = new RowsDataSource();
        await dataSource.query({});

        await dataSource.query({ search: "EDIT" });
        expect(ids(dataSource.rows)).toEqual(["1"]);
        expect(dataSource.meta.totalCount).toBe(1);

        await dataSource.query({ search: "everything" });
        expect(ids(dataSource.rows)).toEqual(["3"]);

        expect(dataSource.loads).toHaveBeenCalledTimes(1);
    });

    it("answers a sort from the loaded rows", async () => {
        const dataSource = new RowsDataSource();
        await dataSource.query({ sort: { field: "name", direction: "ASC" } });
        expect(ids(dataSource.rows)).toEqual(["3", "1", "2"]);

        await dataSource.query({ sort: { field: "name", direction: "DESC" } });
        expect(ids(dataSource.rows)).toEqual(["2", "1", "3"]);

        expect(dataSource.loads).toHaveBeenCalledTimes(1);
    });

    it("loads again when the same query repeats, which is a refresh", async () => {
        const dataSource = new RowsDataSource();
        await dataSource.query({ search: "a" });
        await dataSource.query({ search: "a" });

        expect(dataSource.loads).toHaveBeenCalledTimes(2);
    });

    it("loads again when anything other than search or sort changes", async () => {
        const dataSource = new RowsDataSource();
        await dataSource.query({ limit: 10 });
        await dataSource.query({ limit: 10, search: "a", filters: { system: false } });

        expect(dataSource.loads).toHaveBeenCalledTimes(2);
    });

    it("loads again on a search after the first load failed", async () => {
        const dataSource = new RowsDataSource();
        dataSource.loads.mockRejectedValueOnce(new Error("Network error"));
        await expect(dataSource.query({})).rejects.toThrow("Network error");

        await dataSource.query({ search: "edit" });

        expect(dataSource.loads).toHaveBeenCalledTimes(2);
        expect(ids(dataSource.rows)).toEqual(["1"]);
    });
});
