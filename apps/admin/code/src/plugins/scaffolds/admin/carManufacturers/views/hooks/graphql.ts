import gql from "graphql-tag";

export const LIST_CAR_MANUFACTURERS = gql`
    query ListCarManufacturers($sort: CarManufacturersListSort, $limit: Int, $after: String) {
        carManufacturers {
            listCarManufacturers(sort: $sort, limit: $limit, after: $after) {
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
            }
        }
    }
`;

export const CREATE_CAR_MANUFACTURER = gql`
    mutation CreateCarManufacturer($data: CarManufacturersCreateInput!) {
        carManufacturers {
            createCarManufacturers(data: $data) {
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

export const GET_CAR_MANUFACTURER = gql`
    query GetCarManufacturer($id: ID!) {
        carManufacturers {
            getCarManufacturer(id: $id) {
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

export const DELETE_CAR_MANUFACTURER = gql`
    mutation DeleteCarManufacturer($id: ID!) {
        carManufacturers {
            deleteCarManufacturer(id: $id) {
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

export const UPDATE_CAR_MANUFACTURER = gql`
    mutation UpdateCarManufacturer($id: ID!, $data: CarManufacturerUpdateInput!) {
        carManufacturers {
            updateCarManufacturer(id: $id, data: $data) {
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
