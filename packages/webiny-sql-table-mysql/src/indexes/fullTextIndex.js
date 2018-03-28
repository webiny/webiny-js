// @flow
import { KeyIndex } from "./index";

class FullTextIndex extends KeyIndex {
    getType() {
        return "FULLTEXT";
    }
}

export default FullTextIndex;
