// @flow
import Column from "./../column";
import ColumnsContainer from "../columnsContainer";

class VarCharColumn extends Column {
    size: number;
    constructor(name: string, columnsContainer: ColumnsContainer, size: number) {
        super(name, columnsContainer);
        this.size = size;
    }

    getType() {
        return "VARCHAR";
    }
}

export default VarCharColumn;
