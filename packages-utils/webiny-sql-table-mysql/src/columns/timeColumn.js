// @flow
import {Column} from "webiny-sql-table";

class TimeColumn extends Column {
    getType() {
        return "TIME";
    }
}

export default TimeColumn;
