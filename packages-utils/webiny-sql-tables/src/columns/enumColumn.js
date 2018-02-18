// @flow
import Column from "./../column";
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
}

export default EnumColumn;
