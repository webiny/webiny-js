// @flow
import {Column} from "webiny-sql-table";
import ColumnsContainer from "../columnsContainer";

class TinyTextColumn extends Column {
    size: number;
    constructor(name: string, columnsContainer: ColumnsContainer, size: number) {
        super(name, columnsContainer);
        this.size = size;
    }

    getType() {
        return "TINYTEXT";
    }
}

export default TinyTextColumn;
