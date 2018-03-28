// @flow
import { Index } from "./../../../..";

class PrimaryIndex extends Index {
    getType() {
        return "PRIMARY";
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
