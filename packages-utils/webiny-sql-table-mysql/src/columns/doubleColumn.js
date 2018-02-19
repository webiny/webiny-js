// @flow
import FloatColumn from "./floatColumn";

class DoubleColumn extends FloatColumn {
    getType() {
        return "DOUBLE";
    }
}

export default DoubleColumn;
