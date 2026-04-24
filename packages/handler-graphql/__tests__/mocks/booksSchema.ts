import { createContextPlugin } from "@webiny/handler";
import type { Book, Context } from "~tests/types";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions.js";

export const books: Book[] = [
    {
        name: "Book 1"
    },
    {
        name: "Book 2"
    }
];

class BooksSchema implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaBuilder.Interface
    ): Promise<GraphQLSchemaBuilder.Interface> {
        builder.addTypeDefs(/* GraphQL */ `
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
        `);

        builder.addResolver({
            path: "Query.books",
            dependencies: [],
            resolver: () => {
                return async ({ context }) => {
                    console.group("books resolver");
                    const books = await context.getBooks();
                    console.groupEnd();
                    return books;
                };
            }
        });

        builder.addResolver<{ name: string }>({
            path: "Query.book",
            dependencies: [],
            resolver: () => {
                return async ({ args }) => {
                    console.log("Find book by name");
                    const book = books.find(b => b.name === args.name);
                    if (book) {
                        console.log(`Found book "${book.name}"`);
                        return book;
                    }
                    console.log(`Book not found!`);
                    return null;
                };
            }
        });

        builder.addResolver({
            path: "Book.name",
            dependencies: [],
            resolver: () => {
                return ({ parent }) => {
                    return parent.name;
                };
            }
        });

        builder.addResolver({
            path: "Mutation.createBook",
            dependencies: [],
            resolver: () => {
                return async () => {
                    return true;
                };
            }
        });

        return builder;
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
