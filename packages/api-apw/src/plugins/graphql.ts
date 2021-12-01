import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import workflowSchema from "./graphql/workflow.gql";
import contentReviewSchema from "./graphql/contentReview.gql";
import reviewerSchema from "./graphql/reviewer.gql";
import commentSchema from "./graphql/comment.gql";

const emptyResolver = () => ({});

const baseSchema = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type ApwMeta {
            hasMoreItems: Boolean
            totalCount: Int
            cursor: String
        }
        type ApwCreatedBy {
            id: ID
            displayName: String
            type: String
        }
        type ApwError {
            code: String
            message: String
            data: JSON
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

export default () => [
    baseSchema,
    workflowSchema,
    contentReviewSchema,
    reviewerSchema,
    commentSchema
];
