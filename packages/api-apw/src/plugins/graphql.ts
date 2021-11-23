import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import workflow from "./graphql/workflow";

const emptyResolver = () => ({});

const baseSchema = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        extend type Query {
            advancedPublishingWorkflow: ApwQuery
        }
        extend type Mutation {
            advancedPublishingWorkflow: ApwMutation
        }
    `,
    resolvers: {
        Query: {
            advancedPublishingWorkflow: emptyResolver
        },
        Mutation: {
            advancedPublishingWorkflow: emptyResolver
        }
    }
});

export default () => [baseSchema, workflow];
