// @flow
import Column from "./../column";

class LongBlobColumn extends Column {
    getType() {
        return "LONGBLOB";
    }
}

export default LongBlobColumn;
