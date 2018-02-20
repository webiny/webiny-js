// @flow
import Column from "./column";

class BlobColumn extends Column {
    getType() {
        return "blob";
    }
}

export default BlobColumn;
