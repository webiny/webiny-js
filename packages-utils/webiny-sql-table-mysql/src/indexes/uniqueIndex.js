// @flow
import { KeyIndex } from "./index";

class UniqueIndex extends KeyIndex {
    getType() {
        return "UNIQUE";
    }
}

export default UniqueIndex;
