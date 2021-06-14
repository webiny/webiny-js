import gql from "graphql-tag";

export const LIST_BOOKS = gql`
    query ListBooks($sort: BooksListSort, $limit: Int, $after: String) {
        books {
            listBooks(sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    title
                    description
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                }
                meta {
                    cursor
                    limit
                }
            }
        }
    }
`;

export const CREATE_BOOK = gql`
    mutation CreateBook($data: BookCreateInput!) {
        books {
            createBook(data: $data) {
                id
                title
                description
                createdOn
                savedOn
                createdBy {
                    id
                    displayName
                    type
                }
            }
        }
    }
`;

export const GET_BOOK = gql`
    query GetBook($id: ID!) {
        books {
            getBook(id: $id) {
                id
                title
                description
                createdOn
                savedOn
                createdBy {
                    id
                    displayName
                    type
                }
            }
        }
    }
`;

export const DELETE_BOOK = gql`
    mutation DeleteBook($id: ID!) {
        books {
            deleteBook(id: $id) {
                id
                title
                description
                createdOn
                savedOn
                createdBy {
                    id
                    displayName
                    type
                }
            }
        }
    }
`;

export const UPDATE_BOOK = gql`
    mutation UpdateBook($id: ID!, $data: BookUpdateInput!) {
        books {
            updateBook(id: $id, data: $data) {
                id
                title
                description
                createdOn
                savedOn
                createdBy {
                    id
                    displayName
                    type
                }
            }
        }
    }
`;
