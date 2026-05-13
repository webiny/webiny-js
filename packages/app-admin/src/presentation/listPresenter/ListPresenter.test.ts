import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeAutoObservable, runInAction } from "mobx";
import { Container } from "@webiny/di";
import { ListPresenterFeature } from "./feature.js";
import {
    ListPresenter as Abstraction,
    type IDataSource,
    type IDataSourceQuery,
    type IDataSourceMeta,
    type IListPresenter
} from "./abstractions.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestRow {
    id: string;
    name: string;
    size: number;
}

function createRows(count: number, startIndex = 0): TestRow[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `file-${startIndex + i}`,
        name: `File ${startIndex + i}`,
        size: (startIndex + i) * 100
    }));
}

class MockDataSource implements IDataSource<TestRow> {
    private _rows: TestRow[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    query = vi.fn<(params: IDataSourceQuery) => Promise<void>>();
    loadMore = vi.fn<(params: IDataSourceQuery) => Promise<void>>();

    private defaultRows: TestRow[];
    private defaultMeta: IDataSourceMeta;

    constructor(
        rows: TestRow[] = createRows(3),
        meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: rows.length }
    ) {
        this.defaultRows = rows;
        this.defaultMeta = meta;

        makeAutoObservable(this, { query: false, loadMore: false });

        this.query.mockImplementation(async () => {
            runInAction(() => {
                this._loading = true;
                this._rows = [];
            });
            await Promise.resolve();
            runInAction(() => {
                this._rows = this.defaultRows;
                this._meta = this.defaultMeta;
                this._loading = false;
            });
        });

        this.loadMore.mockImplementation(async () => {
            runInAction(() => {
                this._loading = true;
            });
            await Promise.resolve();
            runInAction(() => {
                this._rows = [...this._rows, ...this.defaultRows];
                this._meta = this.defaultMeta;
                this._loading = false;
            });
        });
    }

    get rows(): TestRow[] {
        return this._rows;
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    mockNextQuery(rows: TestRow[], meta: IDataSourceMeta) {
        this.query.mockImplementationOnce(async () => {
            runInAction(() => {
                this._loading = true;
                this._rows = [];
            });
            await Promise.resolve();
            runInAction(() => {
                this._rows = rows;
                this._meta = meta;
                this._loading = false;
            });
        });
    }

    mockNextLoadMore(rows: TestRow[], meta: IDataSourceMeta) {
        this.loadMore.mockImplementationOnce(async () => {
            runInAction(() => {
                this._loading = true;
            });
            await Promise.resolve();
            runInAction(() => {
                this._rows = [...this._rows, ...rows];
                this._meta = meta;
                this._loading = false;
            });
        });
    }
}

function createMockDataSource(rows?: TestRow[], meta?: IDataSourceMeta): MockDataSource {
    return new MockDataSource(rows, meta);
}

function createPresenter(): IListPresenter<TestRow> {
    const container = new Container();
    ListPresenterFeature.register(container);
    return container.resolve(Abstraction);
}

async function createInitializedPresenter(
    dsOverride?: MockDataSource
): Promise<{ presenter: IListPresenter<TestRow>; dataSource: MockDataSource }> {
    const dataSource = dsOverride ?? createMockDataSource();
    const presenter = createPresenter();
    presenter.init({ dataSource });
    await vi.waitFor(() => {
        expect(presenter.vm.pagination.loading).toBe(false);
    });
    return { presenter, dataSource };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ListPresenter", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // -----------------------------------------------------------------------
    // Init & initial data load
    // -----------------------------------------------------------------------

    describe("init", () => {
        it("should be in empty/uninitialized state before init", () => {
            const presenter = createPresenter();
            const { vm } = presenter;

            expect(vm.rows).toEqual([]);
            expect(vm.sort).toBeNull();
            expect(vm.filters).toEqual({});
            expect(vm.search).toBe("");
            expect(vm.appliedQuery).toBeNull();
            expect(vm.pagination.loading).toBe(false);
            expect(vm.pagination.totalCount).toBe(0);
            expect(vm.empty).toBe(true);
            expect(vm.error).toBeNull();
        });

        it("should trigger initial data load from DataSource", async () => {
            const rows = createRows(3);
            const dataSource = createMockDataSource(rows, {
                cursor: null,
                hasMoreItems: false,
                totalCount: 3
            });

            const presenter = createPresenter();
            presenter.init({ dataSource });

            // Loading should be true immediately after init.
            expect(presenter.vm.pagination.loading).toBe(true);

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.rows).toEqual(rows);
            expect(presenter.vm.pagination.totalCount).toBe(3);
            expect(presenter.vm.pagination.currentCount).toBe(3);
            expect(presenter.vm.empty).toBe(false);
            expect(dataSource.query).toHaveBeenCalledTimes(1);
        });

        it("should apply initialSort from config", async () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({
                dataSource,
                initialSort: { field: "name", direction: "ASC" }
            });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.sort).toEqual({ field: "name", direction: "ASC" });
            expect(dataSource.query).toHaveBeenCalledWith(
                expect.objectContaining({
                    sort: { field: "name", direction: "ASC" }
                })
            );
        });

        it("should apply initialFilters from config", async () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({
                dataSource,
                initialFilters: { type: "image" }
            });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.filters).toEqual({ type: "image" });
            expect(dataSource.query).toHaveBeenCalledWith(
                expect.objectContaining({
                    filters: { type: "image" }
                })
            );
        });

        it("should not query DataSource if init is never called", () => {
            const presenter = createPresenter();
            // Access vm — no query should have been made.
            expect(presenter.vm.rows).toEqual([]);
        });
    });

    // -----------------------------------------------------------------------
    // Sort actions
    // -----------------------------------------------------------------------

    describe("sort", () => {
        it("should set sort and re-query DataSource", async () => {
            const { presenter, dataSource } = await createInitializedPresenter();

            presenter.actions.sort.set("size", "DESC");

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.sort).toEqual({ field: "size", direction: "DESC" });
            // Initial query + sort query.
            expect(dataSource.query).toHaveBeenCalledTimes(2);
            expect(dataSource.query).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    sort: { field: "size", direction: "DESC" }
                })
            );
        });

        it("should toggle direction for the same field", async () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({
                dataSource,
                initialSort: { field: "name", direction: "ASC" }
            });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            presenter.actions.sort.toggle("name");

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.sort).toEqual({ field: "name", direction: "DESC" });
        });

        it("should set ASC when toggling a new field", async () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({
                dataSource,
                initialSort: { field: "name", direction: "DESC" }
            });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            presenter.actions.sort.toggle("size");

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.sort).toEqual({ field: "size", direction: "ASC" });
        });

        it("should reset selection on sort change", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.selection.toggle("file-0");
            expect(presenter.vm.selection.selectedCount).toBe(1);

            presenter.actions.sort.set("name", "ASC");

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.selection.selectedCount).toBe(0);
        });
    });

    // -----------------------------------------------------------------------
    // Filter actions
    // -----------------------------------------------------------------------

    describe("filter", () => {
        it("should set a filter and re-query DataSource", async () => {
            const { presenter, dataSource } = await createInitializedPresenter();

            presenter.actions.filter.set("type", "image");

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.filters).toEqual({ type: "image" });
            expect(dataSource.query).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    filters: { type: "image" }
                })
            );
        });

        it("should clear a single filter and re-query", async () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({
                dataSource,
                initialFilters: { type: "image", tags: ["photo"] }
            });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            presenter.actions.filter.clear("type");

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.filters).toEqual({ tags: ["photo"] });
        });

        it("should clear all filters and re-query", async () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({
                dataSource,
                initialFilters: { type: "image", tags: ["photo"] }
            });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            presenter.actions.filter.clearAll();

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.filters).toEqual({});
            expect(dataSource.query).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    filters: undefined
                })
            );
        });

        it("should reset selection on filter change", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.selection.toggle("file-0");
            expect(presenter.vm.selection.selectedCount).toBe(1);

            presenter.actions.filter.set("type", "image");

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.selection.selectedCount).toBe(0);
        });
    });

    // -----------------------------------------------------------------------
    // Search actions
    // -----------------------------------------------------------------------

    describe("search", () => {
        it("should set search and re-query with debounce", async () => {
            const { presenter, dataSource } = await createInitializedPresenter();
            const initialCallCount = dataSource.query.mock.calls.length;

            presenter.actions.search.set("hello");

            expect(presenter.vm.search).toBe("hello");
            // Should NOT have queried yet (debounce pending).
            expect(dataSource.query.mock.calls.length).toBe(initialCallCount);

            // Advance past the default 300ms debounce.
            vi.advanceTimersByTime(300);

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(dataSource.query).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    search: "hello"
                })
            );
        });

        it("should debounce rapid search changes", async () => {
            const { presenter, dataSource } = await createInitializedPresenter();
            const initialCallCount = dataSource.query.mock.calls.length;

            presenter.actions.search.set("h");
            vi.advanceTimersByTime(100);
            presenter.actions.search.set("he");
            vi.advanceTimersByTime(100);
            presenter.actions.search.set("hel");
            vi.advanceTimersByTime(100);
            presenter.actions.search.set("hello");

            // None of the intermediate searches should have triggered a query.
            expect(dataSource.query.mock.calls.length).toBe(initialCallCount);

            vi.advanceTimersByTime(300);

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            // Only one additional query for the final search term.
            expect(dataSource.query.mock.calls.length).toBe(initialCallCount + 1);
            expect(dataSource.query).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    search: "hello"
                })
            );
        });

        it("should respect custom debounceMs", async () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({ dataSource, debounceMs: 500 });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            const initialCallCount = dataSource.query.mock.calls.length;

            presenter.actions.search.set("test");

            // At 300ms — should NOT have queried yet.
            vi.advanceTimersByTime(300);
            expect(dataSource.query.mock.calls.length).toBe(initialCallCount);

            // At 500ms — should query.
            vi.advanceTimersByTime(200);

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(dataSource.query.mock.calls.length).toBe(initialCallCount + 1);
        });

        it("should clear search immediately (no debounce) and re-query", async () => {
            const { presenter, dataSource } = await createInitializedPresenter();

            // Set search first.
            presenter.actions.search.set("hello");
            vi.advanceTimersByTime(300);

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            const callCountAfterSearch = dataSource.query.mock.calls.length;

            presenter.actions.search.clear();

            // Clear triggers immediate requery (no debounce).
            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.search).toBe("");
            expect(dataSource.query.mock.calls.length).toBe(callCountAfterSearch + 1);
            expect(dataSource.query).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    search: undefined
                })
            );
        });

        it("should reset selection on search change", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.selection.toggle("file-0");
            expect(presenter.vm.selection.selectedCount).toBe(1);

            presenter.actions.search.set("test");
            vi.advanceTimersByTime(300);

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.selection.selectedCount).toBe(0);
        });
    });

    // -----------------------------------------------------------------------
    // Pagination: loadMore & refresh
    // -----------------------------------------------------------------------

    describe("pagination", () => {
        it("should append rows on loadMore", async () => {
            const firstPage = createRows(3, 0);
            const secondPage = createRows(2, 3);

            const dataSource = createMockDataSource(firstPage, {
                cursor: "cursor-1",
                hasMoreItems: true,
                totalCount: 5
            });

            const presenter = createPresenter();
            presenter.init({ dataSource });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.rows).toHaveLength(3);
            expect(presenter.vm.pagination.hasMore).toBe(true);

            dataSource.mockNextLoadMore(secondPage, {
                cursor: null,
                hasMoreItems: false,
                totalCount: 5
            });

            await presenter.actions.loadMore();

            expect(presenter.vm.rows).toHaveLength(5);
            expect(presenter.vm.rows[3].id).toBe("file-3");
            expect(presenter.vm.pagination.hasMore).toBe(false);
            expect(presenter.vm.pagination.totalCount).toBe(5);
            expect(dataSource.loadMore).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    cursor: "cursor-1"
                })
            );
        });

        it("should not loadMore when hasMoreItems is false", async () => {
            const { presenter, dataSource } = await createInitializedPresenter();

            expect(presenter.vm.pagination.hasMore).toBe(false);

            await presenter.actions.loadMore();

            expect(dataSource.loadMore).not.toHaveBeenCalled();
        });

        it("should replace rows on refresh", async () => {
            const { presenter, dataSource } = await createInitializedPresenter();

            const freshRows = createRows(2, 10);
            dataSource.mockNextQuery(freshRows, {
                cursor: null,
                hasMoreItems: false,
                totalCount: 2
            });

            await presenter.actions.refresh();

            expect(presenter.vm.rows).toEqual(freshRows);
            expect(presenter.vm.pagination.totalCount).toBe(2);
            expect(presenter.vm.pagination.currentCount).toBe(2);
        });
    });

    // -----------------------------------------------------------------------
    // Selection
    // -----------------------------------------------------------------------

    describe("selection", () => {
        it("should toggle a single row", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.selection.toggle("file-0");
            expect(presenter.vm.selection.selectedIds.has("file-0")).toBe(true);
            expect(presenter.vm.selection.selectedCount).toBe(1);

            // Toggle off.
            presenter.actions.selection.toggle("file-0");
            expect(presenter.vm.selection.selectedIds.has("file-0")).toBe(false);
            expect(presenter.vm.selection.selectedCount).toBe(0);
        });

        it("should select all rows", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.selection.selectAll();
            expect(presenter.vm.selection.selectedCount).toBe(3);
            expect(presenter.vm.selection.allSelected).toBe(true);
        });

        it("should deselect all rows", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.selection.selectAll();
            presenter.actions.selection.deselectAll();
            expect(presenter.vm.selection.selectedCount).toBe(0);
            expect(presenter.vm.selection.allSelected).toBe(false);
        });

        it("should select specific rows by ids", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.selection.selectRows(["file-0", "file-2"]);
            expect(presenter.vm.selection.selectedCount).toBe(2);
            expect(presenter.vm.selection.selectedIds.has("file-0")).toBe(true);
            expect(presenter.vm.selection.selectedIds.has("file-1")).toBe(false);
            expect(presenter.vm.selection.selectedIds.has("file-2")).toBe(true);
        });

        it("should check if a row is selected via isSelected", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.selection.toggle("file-1");
            expect(presenter.actions.selection.isSelected("file-1")).toBe(true);
            expect(presenter.actions.selection.isSelected("file-0")).toBe(false);
        });

        it("should support shift-click range selection", async () => {
            const rows = createRows(5);
            const dataSource = createMockDataSource(rows, {
                cursor: null,
                hasMoreItems: false,
                totalCount: 5
            });
            const { presenter } = await createInitializedPresenter(dataSource);

            // Select first row (no shift).
            presenter.actions.selection.toggle("file-0");
            expect(presenter.vm.selection.selectedCount).toBe(1);

            // Range select to row 3 — should select 0, 1, 2, 3.
            presenter.actions.selection.selectRangeTo("file-3");
            expect(presenter.vm.selection.selectedCount).toBe(4);
            expect(presenter.vm.selection.selectedIds.has("file-0")).toBe(true);
            expect(presenter.vm.selection.selectedIds.has("file-1")).toBe(true);
            expect(presenter.vm.selection.selectedIds.has("file-2")).toBe(true);
            expect(presenter.vm.selection.selectedIds.has("file-3")).toBe(true);
            expect(presenter.vm.selection.selectedIds.has("file-4")).toBe(false);
        });

        it("should support reverse shift-click range selection", async () => {
            const rows = createRows(5);
            const dataSource = createMockDataSource(rows, {
                cursor: null,
                hasMoreItems: false,
                totalCount: 5
            });
            const { presenter } = await createInitializedPresenter(dataSource);

            // Select row 4 first.
            presenter.actions.selection.toggle("file-4");

            // Range select to row 1 — should select 1, 2, 3, 4.
            presenter.actions.selection.selectRangeTo("file-1");
            expect(presenter.vm.selection.selectedCount).toBe(4);
            expect(presenter.vm.selection.selectedIds.has("file-1")).toBe(true);
            expect(presenter.vm.selection.selectedIds.has("file-2")).toBe(true);
            expect(presenter.vm.selection.selectedIds.has("file-3")).toBe(true);
            expect(presenter.vm.selection.selectedIds.has("file-4")).toBe(true);
        });

        it("should report allSelected correctly", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.selection.toggle("file-0");
            presenter.actions.selection.toggle("file-1");
            expect(presenter.vm.selection.allSelected).toBe(false);

            presenter.actions.selection.toggle("file-2");
            expect(presenter.vm.selection.allSelected).toBe(true);
        });

        it("should report allSelected as false when rows are empty", () => {
            const presenter = createPresenter();
            expect(presenter.vm.selection.allSelected).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // ViewModel computed properties
    // -----------------------------------------------------------------------

    describe("vm computed properties", () => {
        it("should report empty=true when no rows and not loading", async () => {
            const dataSource = createMockDataSource([], {
                cursor: null,
                hasMoreItems: false,
                totalCount: 0
            });

            const { presenter } = await createInitializedPresenter(dataSource);

            expect(presenter.vm.empty).toBe(true);
            expect(presenter.vm.emptyWithFilters).toBe(false);
        });

        it("should report empty=false while loading", () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({ dataSource });

            // During loading, empty should be false.
            expect(presenter.vm.pagination.loading).toBe(true);
            expect(presenter.vm.empty).toBe(false);
        });

        it("should report emptyWithFilters when no rows but filters active", async () => {
            const dataSource = createMockDataSource(createRows(3));
            const { presenter } = await createInitializedPresenter(dataSource);

            dataSource.mockNextQuery([], {
                cursor: null,
                hasMoreItems: false,
                totalCount: 0
            });

            presenter.actions.filter.set("type", "video");

            await vi.waitFor(() => {
                expect(dataSource.query).toHaveBeenCalledTimes(2);
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.empty).toBe(true);
            expect(presenter.vm.emptyWithFilters).toBe(true);
        });

        it("should report emptyWithFilters when no rows but search active", async () => {
            const dataSource = createMockDataSource(createRows(3));
            const { presenter } = await createInitializedPresenter(dataSource);

            dataSource.mockNextQuery([], {
                cursor: null,
                hasMoreItems: false,
                totalCount: 0
            });

            presenter.actions.search.set("nonexistent");
            vi.advanceTimersByTime(300);

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.emptyWithFilters).toBe(true);
        });

        it("should expose error when DataSource query fails", async () => {
            const dataSource = createMockDataSource();
            const { presenter } = await createInitializedPresenter(dataSource);

            dataSource.query.mockRejectedValueOnce(new Error("Network error"));

            await presenter.actions.refresh();

            expect(presenter.vm.error).toEqual({
                code: "UNKNOWN",
                message: "Network error",
                retryable: true
            });
        });

        it("should clear error on successful query", async () => {
            const dataSource = createMockDataSource();
            const { presenter } = await createInitializedPresenter(dataSource);

            dataSource.query.mockRejectedValueOnce(new Error("fail"));
            await presenter.actions.refresh();
            expect(presenter.vm.error).not.toBeNull();

            await presenter.actions.refresh();
            expect(presenter.vm.error).toBeNull();
        });

        it("should expose error on loadMore failure", async () => {
            const dataSource = createMockDataSource(createRows(3), {
                cursor: "cursor-1",
                hasMoreItems: true,
                totalCount: 6
            });

            const { presenter } = await createInitializedPresenter(dataSource);

            dataSource.loadMore.mockRejectedValueOnce(new Error("Load more failed"));

            await presenter.actions.loadMore();

            expect(presenter.vm.error).toEqual({
                code: "UNKNOWN",
                message: "Load more failed",
                retryable: true
            });
        });

        it("should handle non-Error thrown values", async () => {
            const dataSource = createMockDataSource();
            const { presenter } = await createInitializedPresenter(dataSource);

            dataSource.query.mockRejectedValueOnce("string error");
            await presenter.actions.refresh();

            expect(presenter.vm.error).toEqual({
                code: "UNKNOWN",
                message: "string error",
                retryable: true
            });
        });

        it("should expose currentCount matching rows length", async () => {
            const rows = createRows(5);
            const dataSource = createMockDataSource(rows, {
                cursor: null,
                hasMoreItems: false,
                totalCount: 5
            });

            const { presenter } = await createInitializedPresenter(dataSource);

            expect(presenter.vm.pagination.currentCount).toBe(5);
            expect(presenter.vm.pagination.totalCount).toBe(5);
        });
    });

    // -----------------------------------------------------------------------
    // DataSource query params
    // -----------------------------------------------------------------------

    describe("DataSource query params", () => {
        it("should omit undefined search/filters/sort from query", async () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({ dataSource });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            // Initial query should not include search, filters, sort, or cursor.
            expect(dataSource.query).toHaveBeenCalledWith({
                search: undefined,
                filters: undefined,
                sort: undefined,
                cursor: undefined
            });
        });

        it("should include all active params in query", async () => {
            const dataSource = createMockDataSource();
            const presenter = createPresenter();
            presenter.init({
                dataSource,
                initialSort: { field: "name", direction: "ASC" },
                initialFilters: { type: "image" }
            });

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(dataSource.query).toHaveBeenCalledWith({
                search: undefined,
                filters: { type: "image" },
                sort: { field: "name", direction: "ASC" },
                cursor: undefined
            });
        });
    });

    // -----------------------------------------------------------------------
    // appliedQuery
    // -----------------------------------------------------------------------

    describe("appliedQuery", () => {
        it("should be null before init", () => {
            const presenter = createPresenter();
            expect(presenter.vm.appliedQuery).toBeNull();
        });

        it("should be set after initial query completes", async () => {
            const { presenter } = await createInitializedPresenter();

            expect(presenter.vm.appliedQuery).toEqual({
                search: undefined,
                filters: undefined,
                sort: undefined,
                cursor: undefined
            });
        });

        it("should not include search while user is typing (before debounce)", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.search.set("hello");

            expect(presenter.vm.search).toBe("hello");
            expect(presenter.vm.appliedQuery?.search).toBeUndefined();
        });

        it("should include search after debounced query completes", async () => {
            const { presenter } = await createInitializedPresenter();

            presenter.actions.search.set("hello");
            vi.advanceTimersByTime(300);

            await vi.waitFor(() => {
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.appliedQuery?.search).toBe("hello");
        });

        it("should update when filters change and query completes", async () => {
            const { presenter, dataSource } = await createInitializedPresenter();
            const initialCallCount = dataSource.query.mock.calls.length;

            presenter.actions.filter.set("type", "image");

            await vi.waitFor(() => {
                expect(dataSource.query.mock.calls.length).toBe(initialCallCount + 1);
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.appliedQuery?.filters).toEqual({ type: "image" });
        });

        it("should not update when query fails", async () => {
            const dataSource = createMockDataSource();
            const { presenter } = await createInitializedPresenter(dataSource);
            const queryBeforeFailure = presenter.vm.appliedQuery;

            dataSource.query.mockRejectedValueOnce(new Error("fail"));
            await presenter.actions.refresh();

            expect(presenter.vm.error).not.toBeNull();
            expect(presenter.vm.appliedQuery).toBe(queryBeforeFailure);
        });

        it("should clear search after search.clear() query completes", async () => {
            const { presenter, dataSource } = await createInitializedPresenter();
            const initialCallCount = dataSource.query.mock.calls.length;

            presenter.actions.search.set("hello");
            vi.advanceTimersByTime(300);

            await vi.waitFor(() => {
                expect(dataSource.query.mock.calls.length).toBe(initialCallCount + 1);
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.appliedQuery?.search).toBe("hello");

            presenter.actions.search.clear();

            await vi.waitFor(() => {
                expect(dataSource.query.mock.calls.length).toBe(initialCallCount + 2);
                expect(presenter.vm.pagination.loading).toBe(false);
            });

            expect(presenter.vm.appliedQuery?.search).toBeUndefined();
        });
    });
});
