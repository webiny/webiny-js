// @flow
import Column from "./column";

class MediumBlobColumn extends Column {
    getType() {
        return "mediumblob";
    }
}

export default MediumBlobColumn;
