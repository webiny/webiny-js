import { BookEntity } from "../types";
import { Books } from "../entities";
import BooksResolver from "./BooksResolver";

/**
 * Contains base `getBook` and `listBooks` GraphQL resolver functions.
 * Feel free to adjust the code to your needs. Also, note that at some point in time, you will
 * most probably want to implement security-related checks.
 * https://www.webiny.com/docs/tutorials
 */

interface GetBookParams {
    id: string;
}

interface ListBooksParams {
    sort?: "createdOn_ASC" | "createdOn_DESC";
    limit?: number;
    after?: string;
}

interface ListBooksResponse {
    data: BookEntity[];
    meta: { limit: number; cursor: string };
}

interface BooksQuery {
    getBook(params: GetBookParams): Promise<BookEntity>;
    listBooks(params: ListBooksParams): Promise<ListBooksResponse>;
}

/**
 * To define our GraphQL resolvers, we are using the "class method resolvers" approach.
 * https://www.graphql-tools.com/docs/resolvers#class-method-resolvers
 */
export default class BooksQueryResolver extends BooksResolver implements BooksQuery {
    /**
     * Returns a single Book entry from the database.
     * @param id
     */
    async getBook({ id }: GetBookParams) {
        // Query the database and return the entry. If entry was not found, an error is thrown.
        const { Item: targetDataModel } = await Books.get({ PK: this.getPK(), SK: id });
        if (!targetDataModel) {
            throw new Error(`Book "${id}" not found.`);
        }

        return targetDataModel;
    }

    /**
     * List multiple Book entries from the database.
     * Supports basic sorting and cursor-based pagination.
     * @param limit
     * @param sort
     * @param after
     */
    async listBooks({ limit, sort, after }: ListBooksParams) {
        // Let's create the query object. By default, we apply a limit of 10 entries per page and return entries
        // sorted by their time of creation, in a descending order. For this, we rely on the "SK" database column,
        // which contains a sequential MongoDB ID. Check "./BooksMutations.ts" to see how storing is performed.
        const query = {
            limit: limit || 10,
            reverse: sort !== "createdOn_ASC",
            gt: undefined,
            lt: undefined
        };

        // If `after` (cursor string) is specified, we have to apply a lower-than or greater-than query filter.
        if (after) {
            if (query.reverse) {
                query.lt = after;
            } else {
                query.gt = after;
            }
        }

        // Finally, query the database and return the results, along with some meta-data.
        const { Items: data } = await Books.query(this.getPK(), query);

        const cursor = data.length === query.limit ? data[data.length - 1].id : null;
        const meta = {
            limit: query.limit,
            cursor
        };

        return { meta, data };
    }
}
