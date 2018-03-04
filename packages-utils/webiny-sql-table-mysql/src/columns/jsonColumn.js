// @flow
import Column from "./column";

class JSONColumn extends Column {
    getType() {
        return "json";
    }
}

export default JSONColumn;
