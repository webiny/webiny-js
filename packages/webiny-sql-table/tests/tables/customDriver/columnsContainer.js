// @flow
import { ColumnsContainer as BaseColumnsContainer } from "webiny-sql-table";
import { IntColumn, CharColumn } from "./columns";

class ColumnsContainer extends BaseColumnsContainer {
    column(column: string): ColumnsContainer {
        super.column(column);
        return this;
    }

    char(): CharColumn {
        const column = new CharColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    int(): IntColumn {
        const column = new IntColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }
}

export default ColumnsContainer;
