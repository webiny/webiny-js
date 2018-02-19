// @flow
import {Column} from "webiny-sql-table";

class DateTimeColumn extends Column {
    getType() {
        return "DATETIME";
    }
}

export default DateTimeColumn;
