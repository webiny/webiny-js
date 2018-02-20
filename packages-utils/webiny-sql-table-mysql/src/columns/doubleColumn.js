// @flow
import FloatColumn from "./floatColumn";

class DoubleColumn extends FloatColumn {
    getType() {
        return "double";
    }
}

export default DoubleColumn;
