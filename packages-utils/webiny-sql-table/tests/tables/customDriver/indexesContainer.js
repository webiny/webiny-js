// @flow
import { IndexesContainer as BaseIndexesContainer } from "./../../..";
import { PrimaryIndex, UniqueIndex } from "./indexes";

class IndexesContainer extends BaseIndexesContainer {
    primary(): PrimaryIndex {
        const table = this.getParentTable();
        table.setIndex(this.name, new PrimaryIndex(this.name, this));
        return table.getIndex(this.name);
    }

    unique(): UniqueIndex {
        const table = this.getParentTable();
        table.setIndex(this.name, new UniqueIndex(this.name, this));
        return table.getIndex(this.name);
    }
}

export default IndexesContainer;
