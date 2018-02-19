// @flow
import {Column} from "webiny-sql-table";

class BlobColumn extends Column {
    getType() {
        return "BLOB";
    }
}

export default BlobColumn;
