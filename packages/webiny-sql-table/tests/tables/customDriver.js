import { Driver } from "webiny-sql-table";
import ColumnsContainer from "./customDriver/columnsContainer";
import IndexesContainer from "./customDriver/indexesContainer";

class CustomDriver extends Driver {
    getColumnsClass(): Class<ColumnsContainer> {
        return ColumnsContainer;
    }

    getIndexesClass(): Class<IndexesContainer> {
        return IndexesContainer;
    }
}

export default CustomDriver;
