import { createContextPlugin } from "@webiny/handler";
import type { Book, Context } from "~tests/types";
import { GraphQLSchema } from "~/graphql/abstractions.js";

export const books: Book[] = [
    {
        name: "Book 1"
    },
    {
        name: "Book 2"
    }
];

class BooksSchema implements GraphQLSchema.Interface {
    getTypeDefs() {
        return /* GraphQL */ `
            type Book {
                name: String
            }

            extend type Query {
                books: [Book]
                book(name: String!): Book
            }

            extend type Mutation {
                createBook: Boolean
            }
        `;
    }

    getResolvers() {
        return {
            Query: {
                async books(_: any, __: any, context: any) {
                    console.group("books resolver");
                    const books = await context.getBooks();
                    console.groupEnd();
                    return books;
                },
                async book(_: any, { name }: { name: string }) {
                    console.log("Find book by name");
                    const book = books.find(b => b.name === name);
                    if (book) {
                        console.log(`Found book "${book.name}"`);
                        return book;
                    }
                    console.log(`Book not found!`);
                    return null;
                }
            },
            Book: {
                name: (book: Book) => {
                    return book.name;
                }
            },
            Mutation: {
                async createBook() {
                    return true;
                }
            }
        };
    }
}

export const BooksSchemaImpl = GraphQLSchema.createImplementation({
    implementation: BooksSchema,
    dependencies: []
});

export const booksCrudPlugin = createContextPlugin<Context>(async context => {
    context.getBooks = async () => {
        console.log("getBooks");
        console.table(books);
        console.warn("Your store is quite empty!");
        return books;
    };
});

export const booksSchemaPlugin = createContextPlugin<Context>(context => {
    context.container.register(BooksSchemaImpl);
});
