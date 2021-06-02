import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ApplicationContext } from "./types";
import graphql from "./graphql";
import {
    getTarget,
    isInstalled,
    listTargets,
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
            },
            TargetMutation: {
                /**
                 * Store a single target into the database.
                 */
                createTarget,
                /**
                 * Store a single existing target into the database.
                 */
                updateTarget,
                /**
                 * Delete a single existing target from the database.
                 */
                deleteTarget
            }
        }
    }
});
