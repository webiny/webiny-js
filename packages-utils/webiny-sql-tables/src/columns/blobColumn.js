// @flow
import Column from "./../column";

class BlobColumn extends Column {
    getType() {
        return "BLOB";
    }
}

export default BlobColumn;
