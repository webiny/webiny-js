/**
 * Contains all of the GraphQL queries and mutations that we might need while writing our tests.
 * If needed, feel free to add more.
 */

export const GET_BOOK = /* GraphQL */ `
    query GetBook($id: ID!) {
        books {
            getBook(id: $id) {
                id
                title
                description
            }
        }
    }
`;

export const CREATE_BOOK = /* GraphQL */ `
    mutation CreateBook($data: BookCreateInput!) {
        books {
            createBook(data: $data) {
                id
                title
                description
            }
        }
    }
`;

export const UPDATE_BOOK = /* GraphQL*/ `
    mutation UpdateBook($id: ID!, $data: BookUpdateInput!) {
        books {
            updateBook(id: $id, data: $data) {
                id
                title
                description
            }
        }
    }
`;

export const DELETE_BOOK = /* GraphQL */ `
    mutation DeleteBook($id: ID!) {
        books {
            deleteBook(id: $id) {
                id
                title
                description
            }
        }
    }
`;

export const LIST_BOOKS = /* GraphQL */ `
    query ListBooks($sort: BooksListSort, $limit: Int, $after: String) {
        books {
            listBooks(sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    title
                    description
                }
                meta {
                    limit
                    after
                    before
                }
            }
        }
    }
`;
