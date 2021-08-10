import { BookEntity } from "../types";
import { Book } from "../entities";
import BooksResolver from "./BooksResolver";

/**
 * Contains base `getBook` and `listBooks` GraphQL resolver functions.
 * Feel free to adjust the code to your needs. Also, note that at some point in time, you will
 * most probably want to implement security-related checks.
 * https://www.webiny.com/docs/how-to-guides/webiny-cli/scaffolding/extend-graphql-api#essential-files
 */

interface GetBookParams {
    id: string;
}

interface ListBooksParams {
    sort?: "createdOn_ASC" | "createdOn_DESC";
    limit?: number;
    after?: string;
    before?: string;
}

interface ListBooksResponse {
    data: BookEntity[];
    meta: { limit: number; after: string; before: string };
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
        const { Item: book } = await Book.get({ PK: this.getPK(), SK: id });
        if (!book) {
            throw new Error(`Book "${id}" not found.`);
        }

        return book;
    }

    /**
     * List multiple Book entries from the database.
     * Supports basic sorting and cursor-based pagination.
     * @param limit
     * @param sort
     * @param after
     * @param before
     */
    async listBooks({ limit = 10, sort, after, before }: ListBooksParams) {
        const PK = this.getPK();
        const query = { limit, reverse: sort !== "createdOn_ASC", gt: undefined, lt: undefined };
        const meta = { limit, after: null, before: null };

        // The query is constructed differently, depending on the "before" or "after" values.
        if (before) {
            query.reverse = !query.reverse;
            if (query.reverse) {
                query.lt = before;
            } else {
                query.gt = before;
            }

            const { Items } = await Book.query(PK, { ...query, limit: limit + 1 });

            const data = Items.slice(0, limit).reverse();

            const hasBefore = Items.length > limit;
            if (hasBefore) {
                meta.before = Items[Items.length - 1].id;
            }

            meta.after = Items[0].id;

            return { data, meta };
        }

        if (after) {
            if (query.reverse) {
                query.lt = after;
            } else {
                query.gt = after;
            }
        }

        const { Items } = await Book.query(PK, { ...query, limit: limit + 1 });

        const data = Items.slice(0, limit);

        const hasAfter = Items.length > limit;
        if (hasAfter) {
            meta.after = Items[limit - 1].id;
        }

        if (after) {
            meta.before = Items[0].id;
        }

        return { data, meta };
    }
}
