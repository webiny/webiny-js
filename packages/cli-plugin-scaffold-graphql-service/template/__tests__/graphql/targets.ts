// We use these fields in every query / mutation below.
const ERROR_FIELDS = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

// A basic create "Target" mutation.
export const CREATE_TARGET = /* GraphQL */ `
    mutation CreateTarget($data: TargetCreateInput!) {
        targets {
            createTarget(data: $data) {
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

// A basic list "Targets" query.
export const LIST_TARGETS = /* GraphQL */ `
    query ListTargets(
        $where: TargetListWhereInput
        $sort: [TargetListSortEnum!]
        $limit: Int
        $after: String
    ) {
        targets {
            listTargets(where: $where, sort: $sort, limit: $limit, after: $after) {
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
