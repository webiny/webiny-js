import { GraphQLSchemaPlugin } from "~/types";

export const books = [
    {
        name: "Book 1"
    },
    {
        name: "Book 2"
    }
];

export const booksSchema: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    schema: {
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
                books(_, __, context: any) {
                    console.group("books resolver");
                    const books = context.getBooks();
                    console.groupEnd();
                    return books;
                },
                book(_, { name }) {
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
            Mutation: {
                createBook: () => true
            }
        }
    }
};
