// @flow
import {IndexesContainer} from "webiny-sql-table";

import { KeyIndex, PrimaryIndex, UniqueIndex, FullTextIndex } from "./indexes";

/**
 * Contains basic indexes. If needed, this class can be extended to add additional indexes,
 * and then be set as a new indexes container as the default one.
 */
class DefaultIndexesContainer extends IndexesContainer {
    index(index: string): DefaultIndexesContainer {
        super.index(index);
        return this;
    }

    key(): KeyIndex {
        const table = this.getParentTable();
        table.setIndex(this.name, new KeyIndex(this.name, this, Array.from(arguments)));
        return table.getIndex(this.name);
    }

    primary(): PrimaryIndex {
        const table = this.getParentTable();
        table.setIndex(this.name, new PrimaryIndex(this.name, this, Array.from(arguments)));
        return table.getIndex(this.name);
    }

    unique(): UniqueIndex {
        const table = this.getParentTable();
        table.setIndex(this.name, new UniqueIndex(this.name, this, Array.from(arguments)));
        return table.getIndex(this.name);
    }

    fullText(): FullTextIndex {
        const table = this.getParentTable();
        table.setIndex(this.name, new FullTextIndex(this.name, this, Array.from(arguments)));
        return table.getIndex(this.name);
    }
}

export default DefaultIndexesContainer;
