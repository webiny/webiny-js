// @flow
import Column from "./../column";

class LongTextColumn extends Column {
    getType() {
        return "LONGTEXT";
    }
}

export default LongTextColumn;
