import gql from "graphql-tag";
import { merge } from "lodash";
import menus from "./graphql/menus";
import pages from "./graphql/pages";
import pageElements from "./graphql/pageElements";
import categories from "./graphql/categories";
import install from "./graphql/install";
const emptyResolver = () => ({});

export default {
    type: "graphql-schema",
    schema: {
        typeDefs: gql`
            type PbCreatedBy {
                id: ID
                displayName: String
            }
            
            type PbError {
                code: String
                message: String
                data: JSON
            }

            type PbDeleteResponse {
                data: Boolean
                error: PbError
            }

            type PbBooleanResponse {
                data: Boolean
                error: PbError
            }

            type PbCursors {
                next: String
                previous: String
            }

            type PbQuery {
                pageBuilder: PbQuery
            }

            type PbMutation {
                pageBuilder: PbMutation
            }

            extend type Query {
                pageBuilder: PbQuery
            }

            extend type Mutation {
                pageBuilder: PbMutation
            }

            ${menus.typeDefs},
            ${categories.typeDefs},
            ${pages.typeDefs},
            ${pageElements.typeDefs},
            ${install.typeDefs}
        `,
        resolvers: merge(
            {
                Query: {
                    pageBuilder: emptyResolver
                },
                Mutation: {
                    pageBuilder: emptyResolver
                }
            },
            categories.resolvers,
            menus.resolvers,
            pages.resolvers,
            pageElements.resolvers,
            // settings.resolvers,
            install.resolvers
        )
    }
};
