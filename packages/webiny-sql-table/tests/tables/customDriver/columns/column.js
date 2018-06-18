// @flow
import { Column as BaseColumn } from "./../../../..";
import ColumnsContainer from "../columnsContainer";

class Column extends BaseColumn {
    default: ?string | number;
    notNull: boolean;
    unsigned: ?boolean;
    autoIncrement: ?boolean;

    constructor(
        name: string,
        columnsContainer: ColumnsContainer,
        columnArguments: Array<string | number> = []
    ) {
        super(name, columnsContainer, columnArguments);

        /**
         * Column's default value.
         * @var null
         */
        this.default = undefined;

        /**
         * Defines if column accept NULL values.
         * @var null
         */
        this.notNull = false;

        /**
         * Only for numeric columns - defines if column can receive negative values or not.
         * @type {null}
         */
        this.unsigned = null;

        /**
         * Only for numeric columns - defines if column must be auto-incremented or not.
         * @type {null}
         */
        this.autoIncrement = null;
    }

    /**
     * Sets default column value.
     */
    setDefault(defaultValue: string | number | null): this {
        this.default = defaultValue;
        return this;
    }

    /**
     * Returns default column value.
     */
    getDefault(): ?string | number {
        return this.default;
    }

    hasDefault(): boolean {
        return typeof this.default !== "undefined";
    }

    setNotNull(notNull: boolean = true): this {
        this.notNull = notNull;
        return this;
    }

    getNotNull(): boolean {
        return this.notNull;
    }

    setArguments(receivedArguments: Array<string | number> = []): this {
        this.arguments = receivedArguments;
        return this;
    }

    getArguments(): Array<string | number> {
        return this.arguments;
    }

    hasArguments(): boolean {
        return Array.isArray(this.arguments) && this.arguments.length > 0;
    }

    setUnsigned(unsigned: boolean = true): this {
        this.unsigned = unsigned;
        return this;
    }

    getUnsigned(): ?boolean {
        return this.unsigned;
    }

    setAutoIncrement(autoIncrement: boolean = true): this {
        this.autoIncrement = autoIncrement;
        return this;
    }

    getAutoIncrement(): ?boolean {
        return this.autoIncrement;
    }

    getObjectValue(): Object {
        const output = super.getObjectValue();
        output.unsigned = this.getUnsigned();
        output.autoIncrement = this.getAutoIncrement();
        return output;
    }
}

export default Column;
