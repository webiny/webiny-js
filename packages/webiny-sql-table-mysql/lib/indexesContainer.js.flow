// @flow
import { IndexesContainer } from "webiny-sql-table";

import { KeyIndex, PrimaryIndex, UniqueIndex, FullTextIndex } from "./indexes";

/**
 * Contains basic indexes. If needed, this class can be extended to add additional indexes,
 * and then be set as a new indexes container as the default one.
 */
class DefaultIndexesContainer extends IndexesContainer {
    key(): KeyIndex {
        const index = new KeyIndex(this.newIndexName, this, Array.from(arguments));
        this.indexes.push(index);
        return index;
    }

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

    fullText(): FullTextIndex {
        const index = new FullTextIndex(this.newIndexName, this, Array.from(arguments));
        this.indexes.push(index);
        return index;
    }
}

export default DefaultIndexesContainer;
