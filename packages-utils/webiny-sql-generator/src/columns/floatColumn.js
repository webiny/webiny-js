// @flow
import Column from "./../column";
import ColumnsContainer from "../columnsContainer";

class FloatColumn extends Column {
    size: number;
    d: number;
    constructor(name: string, columnsContainer: ColumnsContainer, size: number, d: number) {
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
}

export default FloatColumn;
