import gql from "graphql-tag";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import { hasScope } from "@webiny/api-security";
import {
    emptyResolver,
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";

const bookFetcher = ctx => ctx.models.Book;

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-books",
    schema: {
        typeDefs: gql`
            type BookDeleteResponse {
                data: Boolean
                error: BookError
            }

            type BookCursors {
                next: String
                previous: String
            }

            type BookListMeta {
                cursors: BookCursors
                hasNextPage: Boolean
                hasPreviousPage: Boolean
                totalCount: Int
            }

            type BookError {
                code: String
                message: String
                data: JSON
            }

            type Book {
                id: ID
                title: String
                createdOn: DateTime
            }

            input BookInput {
                id: ID
                title: String!
            }

            input BookListWhere {
                title: String
            }

            input BookListSort {
                title: Int
                createdOn: Int
            }

            type BookResponse {
                data: Book
                error: BookError
            }

            type BookListResponse {
                data: [Book]
                meta: BookListMeta
                error: BookError
            }

            type BookQuery {
                getBook(id: ID): BookResponse

                listBooks(
                    where: BookListWhere
                    sort: BookListSort
                    limit: Int
                    after: String
                    before: String
                ): BookListResponse
            }

            type BookMutation {
                createBook(data: BookInput!): BookResponse

                updateBook(id: ID!, data: BookInput!): BookResponse

                deleteBook(id: ID!): BookDeleteResponse
            }

            extend type Query {
                books: BookQuery
            }

            extend type Mutation {
                books: BookMutation
            }
        `,
        resolvers: {
            Query: {
                books: emptyResolver
            },
            Mutation: {
                books: emptyResolver
            },
            BookQuery: {
                getBook: hasScope("books:crud")(resolveGet(bookFetcher)),
                listBooks: hasScope("books:crud")(resolveList(bookFetcher))
            },
            BookMutation: {
                createBook: hasScope("books:crud")(resolveCreate(bookFetcher)),
                updateBook: hasScope("books:crud")(resolveUpdate(bookFetcher)),
                deleteBook: hasScope("books:crud")(resolveDelete(bookFetcher))
            }
        }
    }
};

export default plugin;
