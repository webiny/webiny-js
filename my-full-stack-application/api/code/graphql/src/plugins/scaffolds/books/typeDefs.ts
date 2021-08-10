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
        type: String!
        displayName: String!
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
        before: String
        after: String
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
        listBooks(limit: Int, before: String, after: String, sort: BooksListSort): BooksList!
    }

    type BookMutation {
        # Creates and returns a new Book entry.
        createBook(data: BookCreateInput!): Book!

        # Updates and returns an existing Book entry.
        updateBook(id: ID!, data: BookUpdateInput!): Book!

        # Deletes and returns an existing Book entry.
        deleteBook(id: ID!): Book!
    }

    extend type Query {
        books: BookQuery
    }

    extend type Mutation {
        books: BookMutation
    }
`;
