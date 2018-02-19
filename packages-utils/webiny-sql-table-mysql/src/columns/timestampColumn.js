// @flow
import {Column} from "webiny-sql-table";

class TimestampColumn extends Column {
    getType() {
        return "TIMESTAMP";
    }
}

export default TimestampColumn;
