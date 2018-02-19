// @flow
import IntColumn from "./intColumn";

class TinyIntColumn extends IntColumn {
    getType() {
        return "TINYINT";
    }
}

export default TinyIntColumn;
