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

    getSize(): number {
        return this.size;
    }

    getObjectValue() {
        const output = super.getObjectValue();
        output.size = this.getSize();
        return output;
    }
}

export default CharColumn;
