// @flow
import IntColumn from "./intColumn";

class MediumIntColumn extends IntColumn {
    getType() {
        return "MEDIUMINT";
    }
}

export default MediumIntColumn;
