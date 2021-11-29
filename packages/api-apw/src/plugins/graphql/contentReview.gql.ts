import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, Response, ListResponse } from "@webiny/handler-graphql";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { ContentReviewStepStatus } from "~/types";

const contentReviewSchema = new GraphQLSchemaPlugin<CmsContext>({
    typeDefs: /* GraphQL */ `
        type ApwContentReviewListItem {
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
            # ContentReview specific fields
            changeRequested: [ApwContentReviewChangeRequested]
            steps: [ApwContentReviewStep]
        }

        type ApwListContentReviewsResponse {
            data: [ApwContentReviewListItem]
            error: ApwError
            meta: ApwMeta
        }

        type ApwContentReviewReviewer {
            id: ID
            displayName: String
        }

        type ApwContentReviewComment {
            body: JSON
            author: String
        }

        type ApwContentReviewChangeRequested {
            title: String
            body: JSON
            media: JSON
            step: String
            resolved: Boolean
            comments: [ApwContentReviewComment]
        }

        enum ApwContentReviewStepStatus {
            done
            active
            inactive
        }

        type ApwContentReviewStep {
            status: ApwContentReviewStepStatus
            slug: String
        }

        type ApwContentReview {
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
            # ContentReview specific fields
            changeRequested: [ApwContentReviewChangeRequested]
            steps: [ApwContentReviewStep]
        }

        type ApwContentReviewResponse {
            data: ApwContentReview
            error: ApwError
        }

        type ApwDeleteContentReviewResponse {
            data: Boolean
            error: ApwError
        }

        enum ApwListContentReviewsSort {
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

        input ApwContentReviewReviewerInput {
            id: ID
        }

        input ApwContentReviewScopeInput {
            type: String
            options: JSON
            # More fields will come later on.
        }

        input ApwContentReviewCommentInput {
            body: JSON
            author: String
        }

        input ApwContentReviewChangeRequestedInput {
            title: String
            body: JSON
            media: JSON
            step: String
            resolved: Boolean
            comments: [ApwContentReviewCommentInput]
        }

        input ApwCreateContentReviewInput {
            changeRequested: [ApwContentReviewChangeRequestedInput]
            workflow: ID!
            content: ID!
        }

        input ApwUpdateContentReviewInput {
            changeRequested: [ApwContentReviewChangeRequestedInput]
        }

        input ApwListContentReviewsWhereInput {
            id: ID
        }

        input ApwListContentReviewsSearchInput {
            # By specifying "query", the search will be performed against workflow' "title" field.
            query: String
        }

        extend type ApwQuery {
            getContentReview(id: ID!): ApwContentReviewResponse

            listContentReviews(
                where: ApwListContentReviewsWhereInput
                limit: Int
                after: String
                sort: [ApwListContentReviewsSort!]
                search: ApwListContentReviewsSearchInput
            ): ApwListContentReviewsResponse
        }

        extend type ApwMutation {
            createContentReview(data: ApwCreateContentReviewInput!): ApwContentReviewResponse

            # Update workflow by given ID.
            updateContentReview(
                id: ID!
                data: ApwUpdateContentReviewInput!
            ): ApwContentReviewResponse

            # Delete workflow
            deleteContentReview(id: ID!): ApwDeleteContentReviewResponse
        }
    `,
    resolvers: {
        // TODO: Make it dynamic
        ApwContentReview: {
            steps: async workflow => {
                return workflow.values.steps;
            },
            changeRequested: async workflow => {
                return workflow.values.changeRequested;
            }
        },
        ApwContentReviewListItem: {
            steps: async workflow => {
                return workflow.values.steps;
            },
            changeRequested: async workflow => {
                return workflow.values.changeRequested;
            }
        },
        ApwQuery: {
            getContentReview: async (_, args, context) => {
                try {
                    const model = await context.cms.getModel("apwContentReviewModelDefinition");
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
            listContentReviews: async (_, args: CmsEntryListParams, context) => {
                try {
                    const model = await context.cms.getModel("apwContentReviewModelDefinition");
                    const [entries, meta] = await context.cms.listEntries(model, args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createContentReview: async (_, args, context) => {
                try {
                    /**
                     * Load the workflow by id and use its steps.
                     */
                    const workflowModel = await context.cms.getModel("apwWorkflowModelDefinition");
                    const workflow = await context.cms.getEntry(workflowModel, {
                        where: { id: args.data.workflow }
                    });

                    const model = await context.cms.getModel("apwContentReviewModelDefinition");
                    const entry = await context.cms.createEntry(model, {
                        ...args.data,
                        // TODO: Move this logic to a function
                        steps: workflow.values.steps.map(step => ({
                            status: ContentReviewStepStatus.INACTIVE,
                            slug: step.slug
                        }))
                    });
                    return new Response(entry);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateContentReview: async (_, args, context) => {
                try {
                    const model = await context.cms.getModel("apwContentReviewModelDefinition");
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
                        // TODO: We need to merge the input with existing data
                        steps: existingEntry.values.steps
                    });
                    return new Response(entry);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteContentReview: async (_, args, context) => {
                try {
                    const model = await context.cms.getModel("apwContentReviewModelDefinition");
                    await context.cms.deleteEntry(model, args.id);
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});

export default contentReviewSchema;
