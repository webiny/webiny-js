import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import workflow from "./graphql/workflow";

const emptyResolver = () => ({});

const baseSchema = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type ApwQuery {
            advancedPublishingWorkflow: ApwQuery
        }
        type ApwMutation {
            advancedPublishingWorkflow: ApwMutation
        }
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
