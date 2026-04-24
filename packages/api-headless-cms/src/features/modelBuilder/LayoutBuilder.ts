type LayoutModifier = (builder: LayoutBuilder) => LayoutBuilder | void;

/**
 * LayoutBuilder provides a fluent API for modifying field layouts.
 * Supports adding fields to existing rows and inserting new rows at specific positions.
 * Callbacks can be queued and executed lazily for efficient composition.
 */
export class LayoutBuilder {
    private layout: string[][];
    private modifiers: LayoutModifier[] = [];

    constructor(existingLayout: string[][] = []) {
        // Deep clone to avoid mutating the original
        this.layout = existingLayout.map(row => [...row]);
    }

    /**
     * Set the layout from an array.
     * This replaces the current layout and clears any queued modifiers.
     */
    setLayout(layout: string[][]): this {
        this.layout = layout.map(row => [...row]);
        // Clear modifiers when directly setting layout
        this.modifiers = [];
        return this;
    }

    /**
     * Add a layout modifier callback to be executed later.
     * Modifiers are queued and executed only when build() is called.
     */
    addModifier(modifier: LayoutModifier): this {
        this.modifiers.push(modifier);
        return this;
    }

    /**
     * Add a field to the same row as the target field.
     *
     * @param field - The field to add
     * @param position - Position relative to target field
     * @throws Error if target field is not found
     */
    addField(field: string, position: { after: string } | { before: string }): this {
        const target = "after" in position ? position.after : position.before;
        const pos = this.findFieldPosition(target);

        if (!pos) {
            throw new Error(
                `Cannot add field "${field}": target field "${target}" not found in layout`
            );
        }

        const { rowIndex, colIndex } = pos;
        const insertIndex = "after" in position ? colIndex + 1 : colIndex;

        this.layout[rowIndex].splice(insertIndex, 0, field);

        return this;
    }

    /**
     * Add a new row at the end of the layout.
     *
     * @param fields - Array of field IDs for the new row
     */
    addRow(fields: string[]): this {
        this.layout.push([...fields]);
        return this;
    }

    /**
     * Insert a new row before or after the row containing the target field.
     *
     * @param fields - Array of field IDs for the new row
     * @param position - Position relative to target field's row
     * @throws Error if target field is not found
     */
    insertRow(fields: string[], position: { after: string } | { before: string }): this {
        const target = "after" in position ? position.after : position.before;
        const pos = this.findFieldPosition(target);

        if (!pos) {
            throw new Error(`Cannot insert row: target field "${target}" not found in layout`);
        }

        const { rowIndex } = pos;
        const insertIndex = "after" in position ? rowIndex + 1 : rowIndex;

        this.layout.splice(insertIndex, 0, [...fields]);

        return this;
    }

    /**
     * Get the current layout without executing modifiers.
     * Used for cloning the builder state.
     */
    getSnapshot(): { layout: string[][]; modifiers: LayoutModifier[] } {
        return {
            layout: this.layout.map(row => [...row]),
            modifiers: [...this.modifiers]
        };
    }

    /**
     * Build the final layout array.
     * Executes all queued modifiers before building.
     */
    build(): string[][] {
        // Execute all queued modifiers
        for (const modifier of this.modifiers) {
            modifier(this);
        }
        // Clear modifiers after execution
        this.modifiers = [];

        return this.layout.map(row => [...row]);
    }

    /**
     * Find the position of a field in the layout.
     *
     * @param field - The field ID to find
     * @returns Position object or null if not found
     */
    private findFieldPosition(field: string): { rowIndex: number; colIndex: number } | null {
        for (let rowIndex = 0; rowIndex < this.layout.length; rowIndex++) {
            const colIndex = this.layout[rowIndex].indexOf(field);
            if (colIndex !== -1) {
                return { rowIndex, colIndex };
            }
        }
        return null;
    }
}
