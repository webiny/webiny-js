// @flow
import Column from "./../column";

class DateTimeColumn extends Column {
    getType() {
        return "DATETIME";
    }
}

export default DateTimeColumn;
