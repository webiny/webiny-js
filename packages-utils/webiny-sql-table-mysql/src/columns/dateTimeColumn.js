// @flow
import Column from "./column";

class DateTimeColumn extends Column {
    getType() {
        return "datetime";
    }
}

export default DateTimeColumn;
