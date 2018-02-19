// @flow
import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import { Driver } from "webiny-sql-table";

class MySQLDriver extends Driver {
    getColumnsClass(): Class<ColumnsContainer> {
        return ColumnsContainer;
    }

    getIndexesClass(): Class<IndexesContainer> {
        return IndexesContainer;
    }
}

export default MySQLDriver;
