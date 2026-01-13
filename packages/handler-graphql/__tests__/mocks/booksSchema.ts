import { createContextPlugin } from "@webiny/handler";
import type { Book, Context } from "~tests/types";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";

export const books: Book[] = [
    {
        name: "Book 1"
    },
    {
        name: "Book 2"
    }
];

class BooksSchema implements CoreGraphQLSchemaFactory.Interface {
    execute(): CoreGraphQLSchemaFactory.Return {
        return [
            {
                typeDefs: /* GraphQL */ `
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
                `,
                resolvers: {
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
                }
            }
        ];
    }
}

export const BooksSchemaImpl = CoreGraphQLSchemaFactory.createImplementation({
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
