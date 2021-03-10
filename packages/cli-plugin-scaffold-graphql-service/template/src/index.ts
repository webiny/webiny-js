import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ApplicationContext } from "./types";
import graphql from "./graphql";
import {
    getTarget,
    isInstalled,
    listTargets,
    install,
    uninstall,
    createTarget,
    updateTarget,
    deleteTarget
} from "./resolvers";

const emptyResolver = () => ({});

export default (): GraphQLSchemaPlugin<ApplicationContext> => ({
    type: "graphql-schema",
    name: "graphql-schema-target",
    schema: {
        /**
         * Schema definition for the GraphQL API.
         */
        typeDefs: graphql,
        resolvers: {
            Query: {
                targets: emptyResolver
            },
            Mutation: {
                targets: emptyResolver
            },
            TargetQuery: {
                /**
                 * Get a single target by ID.
                 */
                getTarget,
                /**
                 * List targets.
                 * Can be filtered with where argument.
                 * Can be sorted with sort argument.
                 */
                listTargets,
                /**
                 * Check if Elasticsearch index is created.
                 * Can be removed if Elasticsearch will not be used.
                 */
                isInstalled
            },
            TargetMutation: {
                /**
                 * Create the Elasticsearch index.
                 * Can be removed if Elasticsearch will not be used.
                 */
                install,
                /**
                 * Delete the Elasticsearch index.
                 * Can be removed if Elasticsearch will not be used.
                 */
                uninstall,
                /**
                 * Store a single target into the database.
                 * It also stores into the Elasticsearch - if not removed.
                 */
                createTarget,
                /**
                 * Store a single existing target into the database.
                 * It also stores into the Elasticsearch - if not removed.
                 */
                updateTarget,
                /**
                 * Delete a single existing target from the database.
                 * It also deletes from the Elasticsearch - if not removed.
                 */
                deleteTarget
            }
        }
    }
});
