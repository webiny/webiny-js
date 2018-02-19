// @flow
import { Column } from "./../../../..";
import ColumnsContainer from "../columnsContainer";

class IntColumn extends Column {
    size: number;
    unsigned: boolean;
    constructor(name: string, columnsContainer: ColumnsContainer, size: number) {
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
}

export default IntColumn;
