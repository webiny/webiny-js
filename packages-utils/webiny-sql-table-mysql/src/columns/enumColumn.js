// @flow
import {Column} from "webiny-sql-table";
import ColumnsContainer from "../columnsContainer";

class EnumColumn extends Column {
    values: Array<mixed>;
    constructor(name: string, columnsContainer: ColumnsContainer, values: Array<mixed>) {
        super(name, columnsContainer);
        this.values = values;
    }

    getType() {
        return "ENUM";
    }

    getValues() {
        return this.values;
    }

    getObjectValue() {
        const output = super.getObjectValue();
        output.values = this.getValues();
        return output;
    }
}

export default EnumColumn;
