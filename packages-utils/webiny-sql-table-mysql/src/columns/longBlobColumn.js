// @flow
import {Column} from "webiny-sql-table";

class LongBlobColumn extends Column {
    getType() {
        return "LONGBLOB";
    }
}

export default LongBlobColumn;
