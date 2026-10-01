import { makeAutoObservable } from "mobx";
import { SaveDashboardLayoutUseCase } from "../saveLayout/abstractions.js";
import { DEFAULT_COLUMN_COUNT } from "../types.js";
import { MAX_COLUMN_COUNT } from "../types.js";
import { MIN_COLUMN_COUNT } from "../types.js";
import type { DashboardLayoutData } from "../types.js";
import { DashboardLayoutPresenter as Abstraction } from "./abstractions.js";
import type { DashboardDropTarget } from "./abstractions.js";
import type { DashboardWidgetInput } from "./abstractions.js";

class DashboardLayoutPresenterImpl implements Abstraction.Interface {
    private _loading = true;
    // Whose layout this is. The presenter is a singleton, so a different user starts over.
    private _userId: string | null = null;
    private _columns: string[][] = [];
    private _columnCount = DEFAULT_COLUMN_COUNT;
    private _hidden: string[] = [];
    private _draggingName: string | null = null;
    private _dropColumn: number | null = null;
    private _dropBeforeName: string | null = null;
    private _editing = false;
    // Non-reactive: each registered widget's default column index, used when (re)adding a widget.
    private _defaultColumns = new Map<string, number>();
    // Non-reactive: saves go out one at a time, and only the newest pending layout is kept.
    private _saving = false;
    private _pendingSave: DashboardLayoutData | null = null;

    constructor(private saveDashboardLayoutUseCase: SaveDashboardLayoutUseCase.Interface) {
        makeAutoObservable<
            DashboardLayoutPresenterImpl,
            | "saveDashboardLayoutUseCase"
            | "_defaultColumns"
            | "_saving"
            | "_pendingSave"
            | "flushSaves"
        >(this, {
            saveDashboardLayoutUseCase: false,
            _defaultColumns: false,
            _saving: false,
            _pendingSave: false,
            flushSaves: false
        });
    }

    get vm(): Abstraction.ViewModel {
        let dropTarget: DashboardDropTarget | null = null;
        if (this._dropColumn !== null) {
            dropTarget = { column: this._dropColumn, beforeName: this._dropBeforeName };
        }

        return {
            loading: this._loading,
            columns: this._columns.map(column => [...column]),
            columnCount: this._columnCount,
            hidden: [...this._hidden],
            draggingName: this._draggingName,
            dropTarget,
            editing: this._editing
        };
    }

    init(
        userId: string,
        widgets: DashboardWidgetInput[],
        savedLayout: DashboardLayoutData | null
    ): void {
        if (this._userId !== userId) {
            // New session or another user: load their saved layout, and drop any save still
            // queued for the previous user so it can't land in this user's profile.
            this._userId = userId;
            this._pendingSave = null;
            this._editing = false;
            this.endDrag();
            const layout = normalizeLayout(savedLayout);
            this.applyOrder(widgets, layout);
            this._loading = false;
            return;
        }

        // A widget was registered/unregistered: keep current state, reconcile. No save.
        this.applyOrder(widgets, {
            columns: this._columns,
            hidden: this._hidden,
            columnCount: this._columnCount
        });
    }

    beginDrag = (name: string): void => {
        this._draggingName = name;
    };

    hoverSlot = (column: number, beforeName: string | null): void => {
        if (this._draggingName === null) {
            return;
        }
        // Suppress no-op slots (dropping where the widget already is) — no indicator, no move.
        const moved = this.computeMove(this._draggingName, column, beforeName);
        if (columnsEqual(moved, this._columns)) {
            if (this._dropColumn !== null) {
                this._dropColumn = null;
                this._dropBeforeName = null;
            }
            return;
        }

        if (this._dropColumn === column && this._dropBeforeName === beforeName) {
            return;
        }
        this._dropColumn = column;
        this._dropBeforeName = beforeName;
    };

    drop = (): void => {
        if (this._draggingName !== null && this._dropColumn !== null) {
            this._columns = this.computeMove(
                this._draggingName,
                this._dropColumn,
                this._dropBeforeName
            );
            this.persist();
        }
        this.endDrag();
    };

    endDrag = (): void => {
        this._draggingName = null;
        this._dropColumn = null;
        this._dropBeforeName = null;
    };

    removeWidget = (name: string): void => {
        this._columns = this._columns.map(column => column.filter(n => n !== name));
        if (!this._hidden.includes(name)) {
            this._hidden = [...this._hidden, name];
        }
        this.persist();
    };

    addWidget = (name: string, column?: number): void => {
        if (!this._hidden.includes(name)) {
            return;
        }
        this._hidden = this._hidden.filter(n => n !== name);

        // Without a column, the widget goes to the column it registered with.
        const requested = column ?? this._defaultColumns.get(name) ?? 0;
        const target = this.clampColumn(requested);
        this._columns = this._columns.map((names, index) => {
            if (index !== target || names.includes(name)) {
                return names;
            }
            return [...names, name];
        });
        this.persist();
    };

    setColumnCount = (count: number): void => {
        const next = clamp(count, MIN_COLUMN_COUNT, MAX_COLUMN_COUNT);
        if (next === this._columnCount) {
            return;
        }
        this._columns = resizeColumns(this._columns, next);
        this._columnCount = next;
        this.persist();
    };

    removeColumn = (index: number): void => {
        if (this._columnCount <= MIN_COLUMN_COUNT || index < 0 || index >= this._columns.length) {
            return;
        }
        const removed = this._columns[index];
        const columns = this._columns.filter((_, i) => i !== index);
        // Fold any stray widgets into the neighboring column so nothing is lost.
        if (removed.length > 0) {
            const target = Math.max(0, index - 1);
            columns[target] = [...columns[target], ...removed];
        }
        this._columns = columns;
        this._columnCount = columns.length;
        this.persist();
    };

    startEditing = (): void => {
        this._editing = true;
    };

    stopEditing = (): void => {
        this._editing = false;
        this.endDrag();
    };

    // The presenter is a singleton that outlives the dashboard, so leaving the page resets what's
    // tied to that visit: the next visit opens out of Customize mode, with no drag in progress.
    // The layout stays, and so does any save still in flight.
    dispose = (): void => {
        this.stopEditing();
    };

    resetToDefault = (): void => {
        this._columnCount = DEFAULT_COLUMN_COUNT;
        const columns: string[][] = Array.from({ length: this._columnCount }, () => []);
        for (const [name, column] of this._defaultColumns) {
            columns[clamp(column, 0, this._columnCount - 1)].push(name);
        }
        this._columns = columns;
        this._hidden = [];
        this.persist();
    };

    /**
     * Rebuild the columns and hidden list from a base state, keeping only currently registered
     * widgets. Widgets neither placed nor hidden are treated as newly registered and appended to
     * their default column.
     */
    private applyOrder(widgets: DashboardWidgetInput[], base: DashboardLayoutData): void {
        const names = widgets.map(w => w.name);
        const registered = new Set(names);
        const placed = new Set<string>();

        const columnCount = clamp(base.columnCount, MIN_COLUMN_COUNT, MAX_COLUMN_COUNT);
        this._columnCount = columnCount;
        const defaults: [string, number][] = widgets.map(w => [
            w.name,
            clamp(w.column, 0, columnCount - 1)
        ]);
        this._defaultColumns = new Map(defaults);

        const columns: string[][] = Array.from({ length: columnCount }, () => []);

        base.columns.forEach((column, index) => {
            const target = Math.min(index, columnCount - 1);
            for (const name of column) {
                if (registered.has(name) && !placed.has(name)) {
                    columns[target].push(name);
                    placed.add(name);
                }
            }
        });

        const hidden: string[] = [];
        for (const name of base.hidden) {
            if (registered.has(name) && !placed.has(name)) {
                hidden.push(name);
                placed.add(name);
            }
        }

        // Newly registered widgets (in neither the order nor hidden) → their default column.
        for (const widget of widgets) {
            if (placed.has(widget.name)) {
                continue;
            }
            columns[clamp(widget.column, 0, columnCount - 1)].push(widget.name);
            placed.add(widget.name);
        }

        this._columns = columns;
        this._hidden = hidden;
    }

    /** Pure computation of the resulting columns if `name` were dropped before `beforeName`. */
    private computeMove(name: string, column: number, beforeName: string | null): string[][] {
        if (beforeName === name) {
            return this._columns.map(c => [...c]);
        }

        const columns = this._columns.map(c => c.filter(n => n !== name));
        const target = columns[this.clampColumn(column)];

        if (beforeName === null) {
            target.push(name);
        } else {
            const index = target.indexOf(beforeName);
            if (index < 0) {
                target.push(name);
            } else {
                target.splice(index, 0, name);
            }
        }

        return columns;
    }

    private clampColumn(column: number): number {
        return clamp(column, 0, this._columnCount - 1);
    }

    private persist(): void {
        this._pendingSave = {
            columns: this._columns,
            hidden: this._hidden,
            columnCount: this._columnCount
        };
        if (!this._saving) {
            void this.flushSaves();
        }
    }

    /*
     * Sends saves one after another. Parallel requests could finish out of order and leave an older
     * layout on the server. A layout queued while a save is in flight replaces any older queued one.
     */
    private async flushSaves(): Promise<void> {
        this._saving = true;
        while (this._pendingSave) {
            const layout = this._pendingSave;
            this._pendingSave = null;
            try {
                await this.saveDashboardLayoutUseCase.execute(layout);
            } catch {
                // Ignore, a failed save must not break the interaction. The layout still applies locally.
            }
        }
        this._saving = false;
    }
}

function clamp(value: number, min: number, max: number): number {
    const upperBounded = Math.min(value, max);
    return Math.max(min, upperBounded);
}

function columnsEqual(a: string[][], b: string[][]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    return a.every((column, index) => {
        const other = b[index];
        return column.length === other.length && column.every((v, i) => v === other[i]);
    });
}

/** Grow/shrink the column list to `count`; widgets in removed columns fold into the last kept one. */
function resizeColumns(columns: string[][], count: number): string[][] {
    if (count >= columns.length) {
        const next = columns.map(c => [...c]);
        while (next.length < count) {
            next.push([]);
        }
        return next;
    }

    const next = columns.slice(0, count).map(c => [...c]);
    for (let i = count; i < columns.length; i++) {
        next[count - 1].push(...columns[i]);
    }
    return next;
}

/** Fill in defaults for a missing layout or missing fields. */
function normalizeLayout(layout: DashboardLayoutData | null): DashboardLayoutData {
    if (!layout) {
        return { columns: [], hidden: [], columnCount: DEFAULT_COLUMN_COUNT };
    }

    const columns = layout.columns ?? [];
    const requestedCount = layout.columnCount ?? columns.length;
    const columnCount = clamp(requestedCount, MIN_COLUMN_COUNT, MAX_COLUMN_COUNT);

    return {
        columns,
        hidden: layout.hidden ?? [],
        columnCount
    };
}

export const DashboardLayoutPresenter = Abstraction.createImplementation({
    implementation: DashboardLayoutPresenterImpl,
    dependencies: [SaveDashboardLayoutUseCase]
});
