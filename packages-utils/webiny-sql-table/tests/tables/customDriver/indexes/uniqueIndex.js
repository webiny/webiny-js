// @flow
import { Index } from "./../../../..";

class UniqueIndex extends Index {
    getType() {
        return "UNIQUE";
    }
}

export default UniqueIndex;
