// @flow
import { IndexesContainer as BaseIndexesContainer } from "webiny-sql-table";
import { PrimaryIndex, UniqueIndex } from "./indexes";

class IndexesContainer extends BaseIndexesContainer {
    primary(): PrimaryIndex {
        const index = new PrimaryIndex(this.newIndexName, this, Array.from(arguments));
        this.indexes.push(index);
        return index;
    }

    unique(): UniqueIndex {
        const index = new UniqueIndex(this.newIndexName, this, Array.from(arguments));
        this.indexes.push(index);
        return index;
    }
}

export default IndexesContainer;
