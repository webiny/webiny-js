// @flow
import Column from "./column";

class EnumColumn extends Column {
    getType() {
        return "enum";
    }
}

export default EnumColumn;
