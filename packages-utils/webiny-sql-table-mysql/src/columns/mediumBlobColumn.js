// @flow
import {Column} from "webiny-sql-table";

class MediumBlobColumn extends Column {
    getType() {
        return "MEDIUMBLOB";
    }
}

export default MediumBlobColumn;
