// @flow
import { Index } from "webiny-sql-table";

class UniqueIndex extends Index {
    getType() {
        return "UNIQUE";
    }
}

export default UniqueIndex;
