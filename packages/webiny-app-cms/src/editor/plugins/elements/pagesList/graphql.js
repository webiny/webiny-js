// @flow
import gql from "graphql-tag";
/*, $sortBy: String, $sortDirection: String*/
export const loadPages = gql`
    query ListPages($perPage: Int) {
        cms {
            listPages(perPage: $perPage) {
                data {
                    id
                    title
                    url
                    createdBy {
                        firstName
                        lastName
                    }
                    category {
                        id
                        name
                    }
                }
            }
        }
    }
`;