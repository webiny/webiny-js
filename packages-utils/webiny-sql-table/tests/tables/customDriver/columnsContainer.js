// @flow
import { ColumnsContainer as BaseColumnsContainer } from "./../../..";
import { IntColumn, CharColumn } from "./columns";

class ColumnsContainer extends BaseColumnsContainer {
    column(column: string): ColumnsContainer {
        super.column(column);
        return this;
    }

    char(width: number): CharColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new CharColumn(this.name, this, width));
        return table.getColumn(this.name);
    }

    int(): IntColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new IntColumn(this.name, this));
        return table.getColumn(this.name);
    }
}

export default ColumnsContainer;
