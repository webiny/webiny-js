// @flow
import {Column} from "webiny-sql-table";

class MediumTextColumn extends Column {
    getType() {
        return "MEDIUMTEXT";
    }
}

export default MediumTextColumn;
