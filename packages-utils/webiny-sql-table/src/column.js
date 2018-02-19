// @flow
import type Table from "./table";
import ColumnsContainer from "./columnsContainer";

class Column {
    name: string;
    type: string;
    columnsContainer: ColumnsContainer;
    autoIncrement: boolean;
    allowNull: boolean;
    default: mixed;
    constructor(name: string, columnsContainer: ColumnsContainer) {
        /**
         * Column name.
         */
        this.name = name;

        /**
         * Column's parent table instance.
         */
        this.columnsContainer = columnsContainer;

        /**
         * Column's default value.
         * @var null
         */
        this.default = null;

        /**
         * Defines if column is auto incremented or not (most commonly used for 'id' column).
         * @var null
         */
        this.autoIncrement = false;

        /**
         * Defines if column accept NULL values.
         * @var null
         */
        this.allowNull = true;
    }

    /**
     * Returns name of column
     */
    getName(): string {
        return this.name;
    }

    /**
     *
     * @returns {string}
     */
    getType(): string {
        return "";
    }

    /**
     * Returns parent table columns container
     */
    getParentColumnsContainer(): ColumnsContainer {
        return this.columnsContainer;
    }

    /**
     * Returns table
     */
    getParentTable(): Table {
        return this.getParentColumnsContainer().getParentTable();
    }

    getObjectValue(): {} {
        return {
            name: this.getName(),
            type: this.getType()
        };
    }

    /**
     * Sets default column value.
     */
    setDefault(defaultValue: ?mixed): this {
        this.default = defaultValue;
        return this;
    }

    /**
     * Returns default column value.
     */
    getDefault() {
        return this.default;
    }

    setAllowNull(allowNull: boolean): this {
        this.allowNull = allowNull;
        return this;
    }

    getAllowNull(): boolean {
        return this.allowNull;
    }
}

export default Column;
