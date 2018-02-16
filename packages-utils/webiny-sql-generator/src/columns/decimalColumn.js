// @flow
import Column from "./../column";

class DecimalColumn extends Column {
    getType() {
        return "DECIMAL";
    }
}

export default DecimalColumn;
