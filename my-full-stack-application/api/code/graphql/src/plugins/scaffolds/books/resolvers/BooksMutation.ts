import { BookEntity } from "../types";
import mdbid from "mdbid";
import { Book } from "../entities";
import BooksResolver from "./BooksResolver";

/**
 * Contains base `createBook`, `updateBook`, and `deleteBook` GraphQL resolver functions.
 * Feel free to adjust the code to your needs. Also, note that at some point in time, you will
 * most probably want to implement custom data validation and security-related checks.
 * https://www.webiny.com/docs/how-to-guides/webiny-cli/scaffolding/extend-graphql-api#essential-files
 */

interface CreateBookParams {
    data: {
        title: string;
        description?: string;
    };
}

interface UpdateBookParams {
    id: string;
    data: {
        title: string;
        description?: string;
    };
}

interface DeleteBookParams {
    id: string;
}

interface BooksMutation {
    createBook(params: CreateBookParams): Promise<BookEntity>;
    updateBook(params: UpdateBookParams): Promise<BookEntity>;
    deleteBook(params: DeleteBookParams): Promise<BookEntity>;
}

/**
 * To define our GraphQL resolvers, we are using the "class method resolvers" approach.
 * https://www.graphql-tools.com/docs/resolvers#class-method-resolvers
 */
export default class BooksMutationResolver extends BooksResolver implements BooksMutation {
    /**
     * Creates and returns a new Book entry.
     * @param data
     */
    async createBook({ data }: CreateBookParams) {
        // If our GraphQL API uses Webiny Security Framework, we can retrieve the
        // currently logged in identity and assign it to the `createdBy` property.
        // https://www.webiny.com/docs/key-topics/security-framework/introduction
        // const { security } = this.context;

        // We use `mdbid` (https://www.npmjs.com/package/mdbid) library to generate
        // a random, unique, and sequential (sortable) ID for our new entry.
        const id = mdbid();

        // const identity = await security.getIdentity();
        const book = {
            ...data,
            PK: this.getPK(),
            SK: id,
            id,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            /* createdBy: identity && {
                id: identity.id,
                type: identity.type,
                displayName: identity.displayName
            }, */
            webinyVersion: process.env.WEBINY_VERSION
        };

        // Will throw an error if something goes wrong.
        await Book.put(book);

        return book;
    }

    /**
     * Updates and returns an existing Book entry.
     * @param id
     * @param data
     */
    async updateBook({ id, data }: UpdateBookParams) {
        // If entry is not found, we throw an error.
        const { Item: book } = await Book.get({ PK: this.getPK(), SK: id });
        if (!book) {
            throw new Error(`Book "${id}" not found.`);
        }

        const updatedBook = { ...book, ...data };

        // Will throw an error if something goes wrong.
        await Book.update(updatedBook);

        return updatedBook;
    }

    /**
     * Deletes and returns an existing Book entry.
     * @param id
     */
    async deleteBook({ id }: DeleteBookParams) {
        // If entry is not found, we throw an error.
        const { Item: book } = await Book.get({ PK: this.getPK(), SK: id });
        if (!book) {
            throw new Error(`Book "${id}" not found.`);
        }

        // Will throw an error if something goes wrong.
        await Book.delete(book);

        return book;
    }
}
