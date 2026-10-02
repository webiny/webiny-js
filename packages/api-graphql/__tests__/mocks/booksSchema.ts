import type { Container } from "@webiny/di";
import type { Book } from "~tests/types";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";
import { createAbstraction } from "@webiny/feature/api";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions.js";

export const books: Book[] = [
    {
        name: "Book 1"
    },
    {
        name: "Book 2"
    }
];

interface IBooksCrud {
    getBooks(): Promise<Book[]>;
}

const BooksCrud = createAbstraction<IBooksCrud>("Tests/BooksCrud");

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
            dependencies: [BooksCrud],
            resolver: (booksCrud: IBooksCrud) => {
                return async () => {
                    console.group("books resolver");
                    const books = await booksCrud.getBooks();
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

// Provides the books the Query.books resolver reads.
export const booksCrudPlugin = (container: Container) => {
    container.registerInstance(BooksCrud, {
        async getBooks() {
            console.log("getBooks");
            console.table(books);
            console.warn("Your store is quite empty!");
            return books;
        }
    });
};

export const booksSchemaPlugin = (container: Container) => {
    container.register(BooksSchemaImpl);
};
