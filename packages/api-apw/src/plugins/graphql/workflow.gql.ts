import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse, Response } from "@webiny/handler-graphql";
import { CmsContext, CmsEntryListParams } from "@webiny/api-headless-cms/types";

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
            app: ApwWorkflowApplication
            title: String
            steps: [ApwWorkflowStep]
            scope: ApwWorkflowScope
        }

        type ApwMeta {
            hasMoreItems: Boolean
            totalCount: Int
            cursor: String
        }

        type ApwListWorkflowsResponse {
            data: [ApwWorkflowListItem]
            error: ApwError
            meta: ApwMeta
        }

        type ApwWorkflowReviewer {
            id: ID
            displayName: String
            #            avatar: File
        }

        type ApwWorkflowStep {
            title: String
            type: ApwWorkflowStepTypes
            reviewers: [ApwWorkflowReviewer]
        }

        type ApwWorkflowScope {
            type: String
            data: JSON
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
            app: ApwWorkflowApplication
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
            pageBuilder
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
            data: JSON
        }

        input ApwCreateWorkflowInput {
            title: String!
            steps: [ApwWorkflowStepInput]!
            scope: ApwWorkflowScopeInput!
            app: ApwWorkflowApplication!
        }

        input ApwUpdateWorkflowInput {
            title: String
            steps: [ApwWorkflowStepInput]
            scope: ApwWorkflowScopeInput
        }

        input ApwListWorkflowsWhereInput {
            app: ApwWorkflowApplication
        }

        input ApwListWorkflowsSearchInput {
            # By specifying "query", the search will be performed against workflow' "title" field.
            query: String
        }

        type ApwQuery {
            getWorkflow(id: ID!): ApwWorkflowResponse

            listWorkflows(
                where: ApwListWorkflowsWhereInput
                limit: Int
                after: String
                sort: [ApwListWorkflowsSort!]
                search: ApwListWorkflowsSearchInput
            ): ApwListWorkflowsResponse
        }

        type ApwMutation {
            createWorkflow(data: ApwCreateWorkflowInput!): ApwWorkflowResponse

            # Update workflow by given ID.
            updateWorkflow(id: ID!, data: ApwUpdateWorkflowInput!): ApwWorkflowResponse

            # Delete workflow
            deleteWorkflow(id: ID!): ApwDeleteWorkflowResponse
        }
    `,
    resolvers: {
        // TODO: Make it dynamic
        ApwWorkflow: {
            title: async workflow => {
                return workflow.values.title;
            },
            app: async workflow => {
                return workflow.values.app;
            },
            steps: async workflow => {
                return workflow.values.steps;
            },
            scope: async workflow => {
                return workflow.values.scope;
            }
        },
        ApwWorkflowListItem: {
            title: async workflow => {
                return workflow.values.title;
            },
            app: async workflow => {
                return workflow.values.app;
            },
            steps: async workflow => {
                return workflow.values.steps;
            },
            scope: async workflow => {
                return workflow.values.scope;
            }
        },
        ApwQuery: {
            getWorkflow: async (_, args, context) => {
                try {
                    const model = await context.cms.getModel("apwWorkflowModelDefinition");
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
            listWorkflows: async (_, args: CmsEntryListParams, context) => {
                try {
                    const model = await context.cms.getModel("apwWorkflowModelDefinition");
                    const [entries, meta] = await context.cms.listEntries(model, args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createWorkflow: async (_, args, context) => {
                try {
                    const model = await context.cms.getModel("apwWorkflowModelDefinition");
                    const entry = await context.cms.createEntry(model, args.data);
                    return new Response(entry);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateWorkflow: async (_, args, context) => {
                try {
                    const model = await context.cms.getModel("apwWorkflowModelDefinition");
                    /**
                     * We're fetching the existing entry here because we're not accepting "app" field as input,
                     * but, we still need to retain its value after the "update" operation.
                     */
                    const existingEntry = await context.cms.getEntry(model, {
                        where: {
                            id: args.id
                        }
                    });

                    const entry = await context.cms.updateEntry(model, args.id, {
                        ...args.data,
                        app: existingEntry.values.app
                    });
                    return new Response(entry);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteWorkflow: async (_, args, context) => {
                try {
                    const model = await context.cms.getModel("apwWorkflowModelDefinition");
                    await context.cms.deleteEntry(model, args.id);
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});

export default workflowSchema;
