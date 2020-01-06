// @flow
import gql from "graphql-tag";

export const INVALIDATE_SSR_CACHE = gql`
    mutation SetHomePage($id: ID!) {
        pageBuilder {
            invalidateSsrCache(id: $id) {
                error {
                    message
                }
            }
        }
    }
`;
