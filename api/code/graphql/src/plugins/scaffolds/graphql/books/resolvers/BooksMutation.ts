import { BookEntity } from "../types";
import mdbid from "mdbid";
import { Books } from "../entities";
import BooksResolver from "./BooksResolver";

/**
 * Contains base `createBook`, `updateBook`, and `deleteBook` GraphQL resolver functions.
 * Feel free to adjust the code to your needs. Also, note that at some point in time, you will
 * most probably want to implement custom data validation and security-related checks.
 * https://www.webiny.com/docs/tutorials
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
     * Creates a new Book entry and responds with it.
     * @param data
     */
    async createBook({ data }: CreateBookParams) {
        const { security } = this.context;

        // We use `mdbid` (https://www.npmjs.com/package/mdbid) library to generate
        // a random, unique, and sequential (sortable) ID for our new entry.
        const id = mdbid();

        const targetDataModel = {
            PK: this.getPK(),
            SK: id,
            id,
            title: data.title,
            description: data.description,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            createdBy: await security.getIdentity(),
            webinyVersion: process.env.WEBINY_VERSION
        };

        // Will throw an error if something goes wrong.
        await Books.put(targetDataModel);

        return targetDataModel;
    }

    /**
     * Updates an existing Book entry and responds with it.
     * @param id
     * @param data
     */
    async updateBook({ id, data }: UpdateBookParams) {
        // If entry is not found, we throw an error.
        const { Item: targetDataModel } = await Books.get({ PK: this.getPK(), SK: id });
        if (!targetDataModel) {
            throw new Error(`Book "${id}" not found.`);
        }

        const updatedBook = { ...targetDataModel, ...data };

        // Will throw an error if something goes wrong.
        await Books.update(updatedBook);

        return updatedBook;
    }

    /**
     * Deletes an existing Book entry and responds with it.
     * @param id
     */
    async deleteBook({ id }: DeleteBookParams) {
        // If entry is not found, we throw an error.
        const { Item: targetDataModel } = await Books.get({ PK: this.getPK(), SK: id });
        if (!targetDataModel) {
            throw new Error(`Book "${id}" not found.`);
        }

        // Will throw an error if something goes wrong.
        await Books.delete(targetDataModel);

        return targetDataModel;
    }
}
