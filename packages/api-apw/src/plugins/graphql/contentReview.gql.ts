import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import {
    ApwContentReviewStep,
    ApwContentReviewStepStatus,
    ApwContext,
    ApwContentReviewListParams,
    ApwContentReviewContent
} from "~/types";
import resolve from "~/utils/resolve";

const contentReviewSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
        type ApwContentReviewListItem {
            # System generated fields
            id: ID
            savedOn: DateTime
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # ContentReview specific fields
            title: String
            steps: [ApwContentReviewStep]
            content: ApwContentReviewContent
            status: ApwContentReviewStatus
            activeStep: ApwContentReviewStep
            totalComments: Int
            latestCommentId: String
            reviewers: [ID!]!
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

        enum ApwContentReviewStatus {
            underReview
            readyToBePublished
            published
            requiresMyAttention
        }

        type ApwContentReviewStep {
            status: ApwContentReviewStepStatus
            id: String
            title: String
            pendingChangeRequests: Int
            signOffProvidedOn: DateTime
            signOffProvidedBy: ApwCreatedBy
        }

        type ApwContentReview {
            # System generated fields
            id: ID
            savedOn: DateTime
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # ContentReview specific fields
            title: String
            steps: [ApwContentReviewStep]
            content: ApwContentReviewContent
            workflow: ID
            status: ApwContentReviewStatus
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
            title_ASC
            title_DESC
        }

        input ApwContentReviewReviewerInput {
            id: ID
        }

        input ApwContentReviewScopeInput {
            type: String
            options: JSON
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

        enum ApwContentReviewContentTypes {
            page
            cms_entry
        }

        type ApwContentReviewContentSettings {
            modelId: String
        }

        input ApwContentReviewContentSettingsInput {
            modelId: String
        }

        type ApwContentReviewContent {
            id: ID!
            type: ApwContentReviewContentTypes!
            version: Int!
            settings: ApwContentReviewContentSettings
            publishedOn: String
            publishedBy: ApwCreatedBy
            scheduledOn: DateTime
            scheduledBy: ApwCreatedBy
        }

        input ApwContentReviewContentInput {
            id: ID!
            type: ApwContentReviewContentTypes!
            settings: ApwContentReviewContentSettingsInput
        }

        input ApwCreateContentReviewInput {
            content: ApwContentReviewContentInput!
        }

        input ApwListContentReviewsWhereInput {
            id: ID
            status: ApwContentReviewStatus
            title: String
            title_contains: String
        }

        type ApwProvideSignOffResponse {
            data: Boolean
            error: ApwError
        }

        type ApwIsReviewRequiredData {
            isReviewRequired: Boolean
            contentReviewId: ID
        }

        type ApwIsReviewRequiredResponse {
            data: ApwIsReviewRequiredData
            error: ApwError
        }

        type ApwPublishContentResponse {
            data: Boolean
            error: ApwError
        }

        enum ApwContentActions {
            publish
            unpublish
        }

        type ApwScheduleActionResponse {
            data: Boolean
            error: ApwError
        }

        input ApwScheduleActionInput {
            action: ApwContentActions!
            datetime: String!
            type: ApwContentReviewContentTypes!
            entryId: ID!
        }

        extend type ApwQuery {
            getContentReview(id: ID!): ApwContentReviewResponse

            listContentReviews(
                where: ApwListContentReviewsWhereInput
                limit: Int
                after: String
                sort: [ApwListContentReviewsSort!]
            ): ApwListContentReviewsResponse

            isReviewRequired(data: ApwContentReviewContentInput!): ApwIsReviewRequiredResponse
        }

        extend type ApwMutation {
            createContentReview(data: ApwCreateContentReviewInput!): ApwContentReviewResponse

            deleteContentReview(id: ID!): ApwDeleteContentReviewResponse

            provideSignOff(id: ID!, step: String!): ApwProvideSignOffResponse

            retractSignOff(id: ID!, step: String!): ApwProvideSignOffResponse

            publishContent(id: ID!, datetime: String): ApwPublishContentResponse

            unpublishContent(id: ID!, datetime: String): ApwPublishContentResponse

            scheduleAction(data: ApwScheduleActionInput!): ApwScheduleActionResponse

            deleteScheduledAction(id: ID!): ApwScheduleActionResponse
        }
    `,
    resolvers: {
        ApwContentReviewContent: {
            version: async (parent: ApwContentReviewContent, _, context: ApwContext) => {
                const getContent = context.apw.getContentGetter(parent.type);
                const content = await getContent(parent.id, parent.settings);
                if (!content) {
                    return null;
                }
                return content.version;
            },
            publishedOn: async (parent: ApwContentReviewContent, _, context: ApwContext) => {
                const getContent = context.apw.getContentGetter(parent.type);
                const content = await getContent(parent.id, parent.settings);
                if (!content) {
                    return null;
                }
                return content.publishedOn;
            },
            publishedBy: async (parent: ApwContentReviewContent, _, context: ApwContext) => {
                const id = parent.publishedBy;
                if (id) {
                    const [[reviewer]] = await context.apw.reviewer.list({
                        where: { identityId: id }
                    });
                    return reviewer;
                }
                return null;
            },
            scheduledBy: async (parent: ApwContentReviewContent, _, context: ApwContext) => {
                const id = parent.scheduledBy;
                if (id) {
                    const [[reviewer]] = await context.apw.reviewer.list({
                        where: { identityId: id }
                    });
                    return reviewer;
                }
                return null;
            }
        },
        ApwContentReviewListItem: {
            activeStep: async parent => {
                const steps: ApwContentReviewStep[] = parent.steps;
                return steps.find(step => step.status === ApwContentReviewStepStatus.ACTIVE);
            },
            totalComments: async parent => {
                const steps: ApwContentReviewStep[] = parent.steps;
                return steps.reduce((count, step) => {
                    /**
                     * Aggregate totalComments from each step.
                     */
                    if (!isNaN(step.totalComments)) {
                        count += step.totalComments;
                    }

                    return count;
                }, 0);
            },
            reviewers: async parent => {
                const steps: ApwContentReviewStep[] = parent.steps;
                const reviewerIds: string[] = [];

                for (const step of steps) {
                    for (const reviewer of step.reviewers) {
                        if (!reviewerIds.includes(reviewer.id)) {
                            reviewerIds.push(reviewer.id);
                        }
                    }
                }
                return reviewerIds;
            }
        },
        ApwQuery: {
            getContentReview: async (_, args: any, context) => {
                return resolve(() => context.apw.contentReview.get(args.id));
            },
            listContentReviews: async (_, args: any, context) => {
                try {
                    /**
                     * We know that args is ApwContentReviewListParams.
                     */
                    const [entries, meta] = await context.apw.contentReview.list(
                        args as unknown as ApwContentReviewListParams
                    );
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            isReviewRequired: async (_, args: any, context) => {
                return resolve(() => context.apw.contentReview.isReviewRequired(args.data));
            }
        },
        ApwMutation: {
            createContentReview: async (_, args: any, context) => {
                return resolve(() => context.apw.contentReview.create(args.data));
            },
            deleteContentReview: async (_, args: any, context) => {
                return resolve(() => context.apw.contentReview.delete(args.id));
            },
            provideSignOff: async (_, args: any, context) => {
                return resolve(() => context.apw.contentReview.provideSignOff(args.id, args.step));
            },
            retractSignOff: async (_, args: any, context) => {
                return resolve(() => context.apw.contentReview.retractSignOff(args.id, args.step));
            },
            publishContent: async (_, args: any, context) => {
                return resolve(() =>
                    context.apw.contentReview.publishContent(args.id, args.datetime)
                );
            },
            unpublishContent: async (_, args: any, context) => {
                return resolve(() =>
                    context.apw.contentReview.unpublishContent(args.id, args.datetime)
                );
            },
            deleteScheduledAction: async (_, args: any, context) => {
                return resolve(() => context.apw.contentReview.deleteScheduledAction(args.id));
            }
        }
    }
});

export default contentReviewSchema;
