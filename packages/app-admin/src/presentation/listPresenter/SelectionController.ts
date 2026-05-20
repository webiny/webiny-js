import { makeAutoObservable } from "mobx";

type GetRowId<TRow> = (row: TRow) => string;
type GetRows<TRow> = () => TRow[];

export class SelectionController<TRow> {
    private _selectedIds: Set<string> = new Set();
    private _anchor = -1;
    private _focus: number | undefined = undefined;

    constructor(
        private getRows: GetRows<TRow>,
        private getRowId: GetRowId<TRow>
    ) {
        makeAutoObservable(this);
    }

    get selectedIds(): Set<string> {
        return this._selectedIds;
    }

    get selectedCount(): number {
        return this._selectedIds.size;
    }

    get allSelected(): boolean {
        const rows = this.getRows();
        return rows.length > 0 && this._selectedIds.size === rows.length;
    }

    toggle(id: string): void {
        const rows = this.getRows();
        const currentIndex = rows.findIndex(row => this.getRowId(row) === id);

        const newSelected = new Set(this._selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
            const lastSelected = Array.from(newSelected).pop();
            this._anchor = lastSelected
                ? rows.findIndex(row => this.getRowId(row) === lastSelected)
                : -1;
        } else {
            newSelected.add(id);
            this._anchor = currentIndex;
        }
        this._focus = undefined;
        this._selectedIds = newSelected;
    }

    // Select the range from the current anchor to the given id.
    // Deselects items that were in the previous range but fall outside the new one.
    selectRangeTo(id: string): void {
        const rows = this.getRows();
        const currentIndex = rows.findIndex(row => this.getRowId(row) === id);

        if (this._anchor < 0 || currentIndex < 0) {
            this.toggle(id);
            return;
        }

        const prevFocus = this._focus;
        this._focus = currentIndex;

        const newStart = Math.min(this._anchor, currentIndex);
        const newEnd = Math.max(this._anchor, currentIndex);

        const newSelected = new Set(this._selectedIds);

        if (prevFocus !== undefined) {
            const oldStart = Math.min(this._anchor, prevFocus);
            const oldEnd = Math.max(this._anchor, prevFocus);
            for (let i = oldStart; i <= oldEnd; i++) {
                if (i < newStart || i > newEnd) {
                    newSelected.delete(this.getRowId(rows[i]));
                }
            }
        }

        for (let i = newStart; i <= newEnd; i++) {
            newSelected.add(this.getRowId(rows[i]));
        }

        this._selectedIds = newSelected;
    }

    selectAll(): void {
        const rows = this.getRows();
        this._selectedIds = new Set(rows.map(row => this.getRowId(row)));
    }

    deselectAll(): void {
        this._selectedIds = new Set();
        this._anchor = -1;
        this._focus = undefined;
    }

    selectRows(ids: string[]): void {
        this._selectedIds = new Set(ids);
    }

    isSelected(id: string): boolean {
        return this._selectedIds.has(id);
    }

    reset(): void {
        this.deselectAll();
    }
}
