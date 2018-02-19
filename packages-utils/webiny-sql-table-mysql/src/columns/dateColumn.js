// @flow
import {Column} from "webiny-sql-table";

class DateColumn extends Column {
    getType() {
        return "DATE";
    }
}

export default DateColumn;
