export default /* GraphQL */ `
    type Book {
        id: ID!
        title: String!
        description: String
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: BookCreatedBy
    }

    type BookCreatedBy {
        id: String!
        displayName: String!
        type: String!
    }

    input BookCreateInput {
        title: String!
        description: String
    }

    input BookUpdateInput {
        title: String
        description: String
    }

    type BooksListMeta {
        limit: Number
        cursor: String
    }

    enum BooksListSort {
        createdOn_ASC
        createdOn_DESC
    }

    type BooksList {
        data: [Book]
        meta: BooksListMeta
    }

    type BookQuery {
        getBook(id: ID!): Book
        listBooks(sort: BooksListSort, limit: Int, after: String): BooksList!
    }

    type BookMutation {
        createBook(data: BookCreateInput!): Book!
        updateBook(id: ID!, data: BookUpdateInput!): Book!
        deleteBook(id: ID!): Book!
    }

    extend type Query {
        books: BookQuery
    }

    extend type Mutation {
        books: BookMutation
    }
`;
