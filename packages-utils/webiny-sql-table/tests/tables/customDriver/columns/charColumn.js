// @flow
import { Column } from "./../../../..";
import ColumnsContainer from "../columnsContainer";

class CharColumn extends Column {
    size: number;
    constructor(name: string, columnsContainer: ColumnsContainer, size: number) {
        super(name, columnsContainer);
        this.size = size;
    }

    getType() {
        return "CHAR";
    }
}

export default CharColumn;
