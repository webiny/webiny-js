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
        typeDefs: graphql,
        resolvers: {
            Query: {
                targets: emptyResolver
            },
            Mutation: {
                targets: emptyResolver
            },
            TargetQuery: {
                getTarget,
                listTargets,
                isInstalled
            },
            TargetMutation: {
                install,
                uninstall,
                createTarget,
                updateTarget,
                deleteTarget
            }
        }
    }
});
