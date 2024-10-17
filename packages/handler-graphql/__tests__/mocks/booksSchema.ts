import { createContextPlugin } from "@webiny/handler";
import { Book, Context } from "~tests/types";
import { createGraphQLSchemaPlugin } from "~/plugins";

export const books: Book[] = [
    {
        name: "Book 1"
    },
    {
        name: "Book 2"
    }
];

export const booksCrudPlugin = createContextPlugin<Context>(async context => {
    context.getBooks = async () => {
        console.log("getBooks");
        console.table(books);
        console.warn("Your store is quite empty!");
        return books;
    };
});

export const booksSchema = createGraphQLSchemaPlugin<Context>({
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
            async books(_, __, context: any) {
                console.group("books resolver");
                const books = await context.getBooks();
                console.groupEnd();
                return books;
            },
            async book(_, { name }) {
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
            name: book => {
                return book.name;
            }
        },
        Mutation: {
            async createBook() {
                return true;
            }
        }
    }
});
