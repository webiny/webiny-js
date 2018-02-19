// @flow
import { Index } from "./../../../..";

class PrimaryIndex extends Index {
    getType() {
        return "PRIMARY";
    }
}

export default PrimaryIndex;
