import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import workflowSchema from "./graphql/workflow.gql";
import contentReviewSchema from "./graphql/contentReview.gql";
import reviewerSchema from "./graphql/reviewer.gql";

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

export default () => [baseSchema, workflowSchema, contentReviewSchema, reviewerSchema];
