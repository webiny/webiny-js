// @flow
import IntColumn from "./intColumn";

class SmallIntColumn extends IntColumn {
    getType() {
        return "SMALLINT";
    }
}

export default SmallIntColumn;
