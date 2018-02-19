// @flow
import Column from "./../column";

class TimestampColumn extends Column {
    getType() {
        return "TIMESTAMP";
    }
}

export default TimestampColumn;
