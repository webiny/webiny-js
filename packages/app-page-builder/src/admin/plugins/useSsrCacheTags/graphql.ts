import gql from "graphql-tag";

export const INVALIDATE_SSR_CACHE = gql`
    mutation SetHomePage($revision: ID!, $refresh: Boolean) {
        pageBuilder {
            invalidateSsrCache(revision: $revision, refresh: $refresh) {
                error {
                    message
                }
            }
        }
    }
`;
