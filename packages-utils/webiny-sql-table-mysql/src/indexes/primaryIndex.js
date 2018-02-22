// @flow
import { KeyIndex } from "./index";

class PrimaryIndex extends KeyIndex {
    getType() {
        return "PRIMARY";
    }

    getSQLValue() {
        return `PRIMARY KEY (${this.getColumns()
            .map(item => `\`${item}\``)
            .join(", ")})`;
    }
}

export default PrimaryIndex;
