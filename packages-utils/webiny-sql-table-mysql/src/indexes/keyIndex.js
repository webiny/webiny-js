// @flow
import { Index } from "webiny-sql-table";

class KeyIndex extends Index {
    getType() {
        return "KEY";
    }
}

export default KeyIndex;
