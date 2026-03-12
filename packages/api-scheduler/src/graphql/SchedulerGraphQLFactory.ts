import { GraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/index.js";
import { ErrorResponse, ListResponse, Response } from "@webiny/handler-graphql/responses.js";
import { ListScheduledActionsUseCase } from "~/features/ListScheduledActions/index.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/index.js";
import { CancelScheduledActionUseCase } from "~/features/CancelScheduledAction/index.js";

export class SchedulerGraphQL implements CoreGraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaBuilder.Interface
    ): Promise<GraphQLSchemaBuilder.Interface> {
        builder.addTypeDefs(`
            enum ScheduleRecordType {
                publish
                unpublish
            }
            
            type ScheduleError {
                message: String!
                code: String
                data: JSON
                stack: String
            }
            
            type ScheduleListMeta {
                hasMoreItems: Boolean!
                totalCount: Int!
                cursor: String
            }
            
            type ScheduleIdentity {
                id: String!
                displayName: String
                type: String
            }
            
            type ScheduleRecord {
                id: ID!
                targetId: String!
                namespace: String!
                scheduledBy: ScheduleIdentity!
                publishOn: DateTime
                unpublishOn: DateTime
                type: ScheduleRecordType!
                title: String!
            }

            type GetScheduledActionResponse {
                data: ScheduleRecord
                error: ScheduleError
            }

            type ListScheduledActionsResponse {
                data: [ScheduleRecord!]
                error: ScheduleError
                meta: ScheduleListMeta
            }

            type CreateScheduledActionResponse {
                data: ScheduleRecord
                error: ScheduleError
            }

            type UpdateScheduledActionResponse {
                data: ScheduleRecord
                error: ScheduleError
            }

            type CancelScheduledActionResponse {
                data: Boolean
                error: ScheduleError
            }

            input ListScheduledActionsWhereInput {
                targetId: ID
                title_contains: String
                title_not_contains: String
                type: ScheduleRecordType
                scheduledBy: ID
                scheduledFor: DateTime
                scheduledFor_gte: DateTime
                scheduledFor_lte: DateTime
            }

            enum ListScheduledActionsSorter {
                title_ASC
                title_DESC
                scheduledFor_ASC
                scheduledFor_DESC
            }
            
            type SchedulerQuery {
                _empty: String
            }
            
            type SchedulerQuery {
                _empty: String
            }

            extend type SchedulerQuery {
                getScheduledAction(namespace: String!, id: ID!): GetScheduledActionResponse!
                
                listScheduledActions(
                    namespace: String!
                    where: ListScheduledActionsWhereInput
                    sort: [ListScheduledActionsSorter!]
                    limit: Int
                    after: String
                ): ListScheduledActionsResponse!
            }

            extend type SchedulerMutation {
                createScheduledAction(
                    namespace: String!
                    id: ID!
                    immediately: Boolean
                    scheduleFor: DateTime
                    type: ScheduleRecordType!
                ): CreateScheduledActionResponse!
                
                updateScheduledAction(
                    namespace: String!
                    id: ID!
                    immediately: Boolean
                    scheduleFor: DateTime
                    type: ScheduleRecordType!
                ): UpdateScheduledActionResponse!
                
                cancelScheduledAction(namespace: String!, id: ID!): CancelScheduledActionResponse!
            }
            
            extend type Query {
                scheduler: SchedulerQuery
            }
            
            extend type Mutation {
                scheduler: SchedulerMutation
            }
        `);

        builder.addResolver<GetScheduledActionUseCase.Params>({
            path: "Query.scheduler.getScheduledAction",
            dependencies: [GetScheduledActionUseCase],
            resolver: (useCase: GetScheduledActionUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListScheduledActionsUseCase.Params>({
            path: "Query.scheduler.listScheduledActions",
            dependencies: [ListScheduledActionsUseCase],
            resolver: (useCase: ListScheduledActionsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new ListResponse(result.value.items, result.value.meta);
                };
            }
        });

        builder.addResolver<ScheduleActionUseCase.Params<any>>({
            path: "Mutation.schedulercreateScheduledAction",
            dependencies: [ScheduleActionUseCase],
            resolver: (useCase: ScheduleActionUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ScheduleActionUseCase.Params<any>>({
            path: "Mutation.schedulerupdateScheduledAction",
            dependencies: [ScheduleActionUseCase],
            resolver: (useCase: ScheduleActionUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<CancelScheduledActionUseCase.Params>({
            path: "Mutation.schedulercancelScheduledAction",
            dependencies: [CancelScheduledActionUseCase],
            resolver: (useCase: CancelScheduledActionUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const SchedulerGraphQLFactory = CoreGraphQLSchemaFactory.createImplementation({
    dependencies: [],
    implementation: SchedulerGraphQL
});
