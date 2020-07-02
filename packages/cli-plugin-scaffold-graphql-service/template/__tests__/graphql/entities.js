const ERROR_FIELDS = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

export const CREATE_ENTITY = /* GraphQL */ `
    mutation CreateEntity($data: EntityInput!) {
        entities {
            createEntity(data: $data) {
                data {
                    id
                    title
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

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
                }
            }
        }
    }
`;
