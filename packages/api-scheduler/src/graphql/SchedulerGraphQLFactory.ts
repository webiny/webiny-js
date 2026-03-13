import { GraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/index.js";
import { ErrorResponse, ListResponse, Response } from "@webiny/handler-graphql/responses.js";
import { ListScheduledActionsUseCase } from "~/features/ListScheduledActions/index.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/index.js";
import { CancelScheduledActionUseCase } from "~/features/CancelScheduledAction/index.js";
import { ScheduledActionNotFoundError } from "~/domain/errors.js";
import type { ScheduledActionType } from "~/shared/abstractions.js";

interface IListScheduledActionsArgs extends ListScheduledActionsUseCase.Params {
    namespace: string;
}

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
                actionType: ScheduleRecordType!
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
                targetId: String
                targetId_in: [String!]
                title: String
                title_contains: String
                title_not_contains: String
                actionType: ScheduleRecordType
                actionType_in: [ScheduleRecordType!]
                scheduledBy: String
                scheduledBy_in: [String!]
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
            
            type SchedulerMutation {
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
                    targetId: ID!
                    immediately: Boolean
                    scheduleFor: DateTime
                    actionType: ScheduleRecordType!
                ): CreateScheduledActionResponse!
                
                updateScheduledAction(
                    namespace: String!
                    targetId: ID!
                    immediately: Boolean
                    scheduleFor: DateTime
                    actionType: ScheduleRecordType!
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

        builder.addResolver({
            path: "Query.scheduler",
            resolver: () => {
                return async () => {
                    return {};
                };
            }
        });
        builder.addResolver({
            path: "Mutation.scheduler",
            resolver: () => {
                return async () => {
                    return {};
                };
            }
        });

        builder.addResolver<GetScheduledActionUseCase.Params>({
            path: "SchedulerQuery.getScheduledAction",
            dependencies: [GetScheduledActionUseCase],
            resolver: (useCase: GetScheduledActionUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args);

                    if (result.isFail()) {
                        if (result.error instanceof ScheduledActionNotFoundError) {
                            return new Response(null);
                        }
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<IListScheduledActionsArgs>({
            path: "SchedulerQuery.listScheduledActions",
            dependencies: [ListScheduledActionsUseCase],
            resolver: (useCase: ListScheduledActionsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute({
                        ...args,
                        where: {
                            ...args.where,
                            namespace: args.namespace
                        }
                    });

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new ListResponse(result.value.items, result.value.meta);
                };
            }
        });

        builder.addResolver<ScheduleActionUseCase.Params>({
            path: "SchedulerMutation.createScheduledAction",
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

        builder.addResolver<ScheduleActionUseCase.Params>({
            path: "SchedulerMutation.updateScheduledAction",
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
            path: "SchedulerMutation.cancelScheduledAction",
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
