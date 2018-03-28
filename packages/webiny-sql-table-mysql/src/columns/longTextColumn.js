// @flow
import Column from "./column";

class LongTextColumn extends Column {
    getType() {
        return "longtext";
    }
}

export default LongTextColumn;
