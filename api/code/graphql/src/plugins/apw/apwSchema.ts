import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse, Response } from "@webiny/handler-graphql";
import { CmsContext } from "@webiny/api-headless-cms/types";

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

const workflowSchema = new GraphQLSchemaPlugin<CmsContext>({
    typeDefs: /* GraphQL */ `
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

        type ApwWorkflowListItem {
            # System generated fields
            id: ID
            pid: ID
            publishedOn: DateTime
            locked: Boolean
            version: Int
            savedOn: DateTime
            createdFrom: ID
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # Workflow specific fields
            title: String
            steps: [ApwWorkflowStep]
            scope: ApwWorkflowScope
        }

        type ApwListWorkflowsResponse {
            data: [ApwWorkflowListItem]
            error: ApwError
        }

        type ApwWorkflowReviewer {
            id: ID
            displayName: String
            avatar: File
        }

        type ApwWorkflowStep {
            title: String
            type: ApwWorkflowStepTypes
            reviewers: [ApwWorkflowReviewer]
        }

        type ApwWorkflowScope {
            type: String
            options: JSON
        }

        type ApwWorkflow {
            # System generated fields
            id: ID
            pid: ID
            publishedOn: DateTime
            locked: Boolean
            version: Int
            savedOn: DateTime
            createdFrom: ID
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # Workflow specific fields
            title: String
            steps: [ApwWorkflowStep]
            scope: ApwWorkflowScope
        }

        type ApwWorkflowResponse {
            data: ApwWorkflow
            error: ApwError
        }

        type ApwDeleteWorkflowResponse {
            data: Boolean
            error: ApwError
        }

        enum ApwWorkflowApplication {
            PageBuilder
            cms
            formBuilder
        }

        enum ApwWorkflowStepTypes {
            mandatory_blocking
            mandatory_non_blocking
            not_mandatory
        }

        enum ApwListWorkflowsSort {
            id_ASC
            id_DESC
            savedOn_ASC
            savedOn_DESC
            createdOn_ASC
            createdOn_DESC
            publishedOn_ASC
            publishedOn_DESC
            title_ASC
            title_DESC
        }

        input ApwWorkflowReviewerInput {
            id: ID
        }

        input ApwWorkflowStepInput {
            title: String
            type: ApwWorkflowStepTypes
            reviewers: [ApwWorkflowReviewerInput]
        }

        input ApwWorkflowScopeInput {
            type: String
            options: JSON
            # More fields will come later on.
        }

        input ApwUpdateWorkflowInput {
            title: String
            steps: ApwWorkflowStepInput!
            scope: ApwWorkflowScopeInput
        }

        input ApwListWorkflowsWhereInput {
            app: ApwWorkflowApplication
        }

        input ApwListWorkflowsSearchInput {
            # By specifying "query", the search will be performed against workflow' "title" field.
            query: String
        }

        extend type ApwQuery {
            getWorkflow(id: ID!): ApwWorkflowResponse

            listWorkflows(
                where: ApwListWorkflowsWhereInput
                limit: Int
                after: String
                sort: [ApwListWorkflowsSort!]
                search: ApwListWorkflowsSearchInput
            ): ApwListWorkflowsResponse
        }

        extend type ApwMutation {
            createWorkflow(from: ID, app: ApwWorkflowApplication): ApwWorkflowResponse

            # Update workflow by given ID.
            updateWorkflow(id: ID!, data: ApwUpdateWorkflowInput!): ApwWorkflowResponse

            # Delete workflow
            deleteWorkflow(id: ID!): ApwDeleteWorkflowResponse
        }
    `,
    resolvers: {
        ApwQuery: {
            getWorkflow: async (_, args, context) => {
                try {
                    console.log(JSON.stringify({ args }, null, 2));
                    const model = await context.cms.getModel("apwWorkflow");
                    const entry = await context.cms.getEntry(model, {
                        where: {
                            id: args.id
                        }
                    });
                    return new Response(entry);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listWorkflows: async (_, args) => {
                try {
                    console.log(JSON.stringify({ args }, null, 2));
                    // const [data, meta] = await context.pageBuilder.pages.listPublished(args);
                    return new ListResponse([], null);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createWorkflow: async (_, args, context) => {
                try {
                    console.log(JSON.stringify({ args }, null, 2));
                    console.log(context.cms);
                    const model = await context.cms.getModel("apwWorkflow");
                    console.log(model);
                    await context.cms.createEntry(model, args);
                    return new Response(null);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateWorkflow: async (_, args) => {
                try {
                    console.log(JSON.stringify({ args }, null, 2));
                    // const [data, meta] = await context.pageBuilder.pages.listPublished(args);
                    return new Response(null);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteWorkflow: async (_, args) => {
                try {
                    console.log(JSON.stringify({ args }, null, 2));
                    // const [data, meta] = await context.pageBuilder.pages.listPublished(args);
                    return new Response(null);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});

export default () => [baseSchema, workflowSchema];
