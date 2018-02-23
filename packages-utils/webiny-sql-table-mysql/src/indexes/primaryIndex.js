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

    /**
     * Primary indexes don't have a name, so it's safe to return null here.
     * @returns {null}
     */
    getName(): ?string {
        return null;
    }
}

export default PrimaryIndex;
