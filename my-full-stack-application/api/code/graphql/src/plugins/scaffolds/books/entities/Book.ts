// https://github.com/jeremydaly/dynamodb-toolbox
import { Entity } from "dynamodb-toolbox";
import table from "./table";
import { BookEntity } from "../types";

/**
 * Once we have the table, we define the BookEntity entity.
 * If needed, additional entities can be defined using the same approach.
 */
export default new Entity<BookEntity>({
    table,
    name: "Book",
    timestamps: false,
    attributes: {
        PK: { partitionKey: true },
        SK: { sortKey: true },
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        createdOn: { type: "string" },
        savedOn: { type: "string" },
        createdBy: { type: "map" },

        // Will store current version of Webiny, for example "5.9.1".
        // Might be useful in the future or while performing upgrades.
        webinyVersion: { type: "string" }
    }
});
