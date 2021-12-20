import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { ApwContext, ListWorkflowsParams } from "~/types";
import resolve from "~/utils/resolve";
import { generateFieldResolvers } from "~/utils/fieldResolver";

const fieldIds = ["app", "title", "steps", "scope"];

const workflowSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
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
            slug: String
            type: ApwWorkflowStepTypes
            reviewers: [ApwRefField!]
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
            mandatoryBlocking
            mandatoryNonBlocking
            notMandatory
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

        input ApwCreateWorkflowStepInput {
            title: String!
            slug: String!
            type: ApwWorkflowStepTypes!
            reviewers: [ApwRefFieldInput!]!
        }

        input ApwUpdateWorkflowStepInput {
            title: String
            slug: String
            type: ApwWorkflowStepTypes
            reviewers: [ApwRefFieldInput!]
        }

        input ApwWorkflowScopeInput {
            type: String
            data: JSON
        }

        input ApwCreateWorkflowInput {
            title: String!
            steps: [ApwCreateWorkflowStepInput]!
            scope: ApwWorkflowScopeInput!
            app: ApwWorkflowApplication!
        }

        input ApwUpdateWorkflowInput {
            title: String
            steps: [ApwUpdateWorkflowStepInput]
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
        ApwWorkflow: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwWorkflowListItem: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwQuery: {
            getWorkflow: async (_, args, context) => {
                return resolve(() => context.apw.workflow.get(args.id));
            },
            listWorkflows: async (_, args: ListWorkflowsParams, context) => {
                try {
                    const [entries, meta] = await context.apw.workflow.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createWorkflow: async (_, args, context) => {
                return resolve(() => context.apw.workflow.create(args.data));
            },
            updateWorkflow: async (_, args, context) => {
                return resolve(() => context.apw.workflow.update(args.id, args.data));
            },
            deleteWorkflow: async (_, args, context) => {
                return resolve(() => context.apw.workflow.delete(args.id));
            }
        }
    }
});

export default workflowSchema;
