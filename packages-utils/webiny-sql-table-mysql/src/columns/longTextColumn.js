// @flow
import {Column} from "webiny-sql-table";

class LongTextColumn extends Column {
    getType() {
        return "LONGTEXT";
    }
}

export default LongTextColumn;
