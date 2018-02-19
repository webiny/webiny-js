// @flow
import {Column} from "webiny-sql-table";

class YearColumn extends Column {
    getType() {
        return "YEAR";
    }
}

export default YearColumn;
