// @flow
import {Column} from "webiny-sql-table";
import ColumnsContainer from "../columnsContainer";

class FloatColumn extends Column {
    size: ?number;
    d: ?number;

    constructor(name: string, columnsContainer: ColumnsContainer, size: ?number = null, d: ?number = null) {
        super(name, columnsContainer);

        /**
         * The maximum number of digits.
         * @type {number}
         */
        this.size = size;

        /**
         * The maximum number of digits to the right of the decimal point.
         * @type {number}
         */
        this.d = d;
    }

    getType() {
        return "FLOAT";
    }

    getObjectValue() {
        const output = super.getObjectValue();
        output.size = this.getSize();
        output.d = this.getD();
        return output;
    }

    getSize() {
        return this.size;
    }

    getD() {
        return this.d;
    }
}

export default FloatColumn;
