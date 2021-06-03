import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { ApplicationContext } from "./types";
import typeDefs from "./typeDefs";
import { TargetMutation, TargetQuery } from "./resolvers";

export default new GraphQLSchemaPlugin<ApplicationContext>({
    typeDefs,
    resolvers: {
        Query: {
            i18n: (_, __, context) => {
                return new TargetQuery(context);
            }
        },
        Mutation: {
            i18n: (_, __, context) => {
                return new TargetMutation(context);
            }
        }
    }
});
