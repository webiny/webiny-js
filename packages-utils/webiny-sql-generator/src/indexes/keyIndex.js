// @flow
import Index from "./../index";
import IndexesContainer from "../indexesContainer";

class KeyIndex extends Index {
    columns: Array<string>;
    constructor(name: string, indexesContainer: IndexesContainer, columns: Array<string>) {
        super(name, indexesContainer);

        /**
         * The maximum number of digits.
         * @type {number}
         */
        this.columns = columns;
    }

    getType() {
        return "KEY";
    }
}

export default KeyIndex;
