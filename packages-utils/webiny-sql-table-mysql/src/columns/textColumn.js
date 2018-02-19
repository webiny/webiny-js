// @flow
import {Column} from "webiny-sql-table";

class TextColumn extends Column {
    getType() {
        return "TEXT";
    }
}

export default TextColumn;
