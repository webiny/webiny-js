// @flow
import FloatColumn from "./floatColumn";

class DecimalColumn extends FloatColumn {
    getType() {
        return "DECIMAL";
    }
}

export default DecimalColumn;
