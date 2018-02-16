// @flow
import { KeyIndex } from "./index";

class PrimaryIndex extends KeyIndex {
    getType() {
        return "PRIMARY";
    }
}

export default PrimaryIndex;
