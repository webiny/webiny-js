// We use these fields in every query / mutation below.
const ERROR_FIELDS = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

// A basic create "Entity" mutation.
export const CREATE_ENTITY = /* GraphQL */ `
    mutation CreateEntity($data: EntityInput!) {
        entities {
            createEntity(data: $data) {
                data {
                    id
                    title
                    description
                    isNice
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

// A basic list "Entities" query.
export const LIST_ENTITIES = /* GraphQL */ `
    query ListEntities(
        $where: EntityListWhere
        $sort: EntityListSort
        $limit: Int
        $after: String
        $before: String
    ) {
        entities {
            listEntities(where: $where, sort: $sort, limit: $limit, after: $after, before: $before) {
                data {
                    id
                    title
                    description
                    isNice
                }
                error ${ERROR_FIELDS}

            }
        }
    }
`;
