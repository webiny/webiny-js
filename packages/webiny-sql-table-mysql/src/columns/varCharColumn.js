// @flow
import Column from "./column";

class VarCharColumn extends Column {
    getType() {
        return "varchar";
    }
}

export default VarCharColumn;
