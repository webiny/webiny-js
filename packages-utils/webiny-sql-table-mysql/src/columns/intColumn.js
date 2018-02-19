// @flow
import { Column } from "webiny-sql-table";
import ColumnsContainer from "../columnsContainer";

class IntColumn extends Column {
    size: ?number;
    unsigned: boolean;
    autoIncrement: boolean;
    constructor(name: string, columnsContainer: ColumnsContainer, size: ?number = null) {
        super(name, columnsContainer);

        /**
         * The maximum number of digits.
         * @type {number}
         */
        this.size = size;

        /**
         * Defines if column is unsigned or not (only for numbers).
         * @var null
         */
        this.unsigned = false;

        /**
         * Defines if column is auto incremented or not.
         * @var null
         */
        this.autoIncrement = false;
    }

    getType() {
        return "INT";
    }

    setUnsigned(unsigned: boolean = true): this {
        this.unsigned = unsigned;
        return this;
    }

    getUnsigned(): boolean {
        return this.unsigned;
    }

    setAutoIncrement(autoIncrement: boolean = true): this {
        this.autoIncrement = autoIncrement;
        return this;
    }

    getAutoIncrement(): boolean {
        return this.autoIncrement;
    }

    getSize(): ?number {
        return this.size;
    }

    getObjectValue() {
        const output = super.getObjectValue();
        output.unsigned = this.getUnsigned();
        output.autoIncrement = this.getAutoIncrement();
        output.size = this.getSize();
        return output;
    }
}

export default IntColumn;
