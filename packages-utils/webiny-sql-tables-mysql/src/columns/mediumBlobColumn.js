// @flow
import Column from "./../column";

class MediumBlobColumn extends Column {
    getType() {
        return "MEDIUMBLOB";
    }
}

export default MediumBlobColumn;
